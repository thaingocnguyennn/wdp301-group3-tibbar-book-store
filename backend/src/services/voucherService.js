import mongoose from "mongoose";
import Voucher from "../models/Voucher.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import UserVoucher from "../models/UserVoucher.js";
import ApiError from "../utils/ApiError.js";

const SEGMENT_TYPES = {
  NEW_CUSTOMER: "NEW_CUSTOMER",
  VIP_CUSTOMER: "VIP_CUSTOMER",
  INACTIVE_CUSTOMER: "INACTIVE_CUSTOMER",
  BIRTHDAY_THIS_MONTH: "BIRTHDAY_THIS_MONTH",
  PURCHASED_OVER_X: "PURCHASED_OVER_X",
};

class VoucherService {
  async syncExpiredVouchers(now = new Date()) {
    const expiredVouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $ne: null, $lte: now },
    })
      .select("_id")
      .lean();

    if (expiredVouchers.length === 0) {
      await UserVoucher.updateMany(
        {
          status: { $ne: "EXPIRED" },
          expiresAt: { $ne: null, $lte: now },
        },
        { $set: { status: "EXPIRED" } },
      );
      return { expiredVoucherCount: 0 };
    }

    const expiredVoucherIds = expiredVouchers.map((item) => item._id);

    await Promise.all([
      Voucher.updateMany(
        { _id: { $in: expiredVoucherIds }, isActive: true },
        { $set: { isActive: false } },
      ),
      UserVoucher.updateMany(
        {
          $or: [
            { voucher: { $in: expiredVoucherIds } },
            { expiresAt: { $ne: null, $lte: now } },
          ],
          status: { $ne: "EXPIRED" },
        },
        { $set: { status: "EXPIRED" } },
      ),
    ]);

    return { expiredVoucherCount: expiredVoucherIds.length };
  }

  isVoucherExpired(voucher, now = new Date()) {
    if (!voucher?.expiryDate) return false;
    return new Date(voucher.expiryDate) < now;
  }

  isUserVoucherExpired(userVoucher, now = new Date()) {
    if (!userVoucher?.expiresAt) return false;
    return new Date(userVoucher.expiresAt) < now;
  }

  async getAllVouchers() {
    await this.syncExpiredVouchers();
    return Voucher.find({}).sort({ createdAt: -1 }).lean();
  }

  async getAvailableVouchers(subtotal = 0, userId = null) {
    await this.syncExpiredVouchers();
    const now = new Date();
    const normalizedSubtotal = Number(subtotal) || 0;

    const publicVouchers = await Voucher.find({
      isActive: true,
      audienceType: "PUBLIC",
      $or: [
        { expiryDate: { $gt: now } },
        { expiryDate: null },
        { expiryDate: { $exists: false } },
      ],
      minOrderValue: { $lte: normalizedSubtotal },
    })
      .sort({ minOrderValue: -1 })
      .lean();

    if (!userId) {
      return publicVouchers;
    }

    const assignedRecords = await UserVoucher.find({
      user: userId,
      status: { $ne: "EXPIRED" },
      $expr: { $lt: ["$usageCount", "$maxUsage"] },
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } },
      ],
    })
      .populate("voucher")
      .sort({ assignedAt: -1 })
      .lean();

    const assignedVouchers = assignedRecords
      .filter((record) => {
        const voucher = record.voucher;
        if (!voucher) return false;
        if (!voucher.isActive) return false;
        if (voucher.audienceType !== "ASSIGNED") return false;
        if (this.isVoucherExpired(voucher, now)) return false;
        if (normalizedSubtotal < Number(voucher.minOrderValue || 0))
          return false;
        return true;
      })
      .map((record) => ({
        ...record.voucher,
        assignedVoucherId: record._id,
        assignedStatus: record.status,
      }));

    return [...assignedVouchers, ...publicVouchers];
  }

  async createVoucher(payload) {
    this.validateVoucherPayload(payload, true);

    const existingVoucher = await Voucher.findOne({
      code: String(payload.code).trim().toUpperCase(),
    });

    if (existingVoucher) {
      throw ApiError.conflict("Voucher code already exists");
    }

    const voucher = await Voucher.create({
      ...payload,
      code: String(payload.code).trim().toUpperCase(),
    });

    return voucher;
  }

  async updateVoucher(voucherId, payload) {
    this.validateVoucherPayload(payload, false);

    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
      const existingVoucher = await Voucher.findOne({
        code: payload.code,
        _id: { $ne: voucherId },
      });

      if (existingVoucher) {
        throw ApiError.conflict("Voucher code already exists");
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(
      voucherId,
      { $set: payload },
      { new: true, runValidators: true },
    );

    if (!voucher) {
      throw ApiError.notFound("Voucher not found");
    }

    if (
      payload.maxUsagePerUser !== undefined ||
      payload.expiryDate !== undefined
    ) {
      const maxUsage = Number(voucher.maxUsagePerUser || 1);
      const expiresAt = voucher.expiryDate || null;

      await UserVoucher.updateMany(
        { voucher: voucher._id },
        {
          $set: {
            maxUsage,
            expiresAt,
          },
        },
      );
    }

    return voucher;
  }

  async getUserVoucherWallet(userId) {
    await this.syncExpiredVouchers();
    const records = await UserVoucher.find({ user: userId })
      .populate("voucher")
      .sort({ assignedAt: -1 })
      .lean();

    const now = new Date();
    const expiredIds = [];

    const items = records
      .filter((record) => !!record.voucher)
      .map((record) => {
        const voucher = record.voucher;
        const voucherExpired = this.isVoucherExpired(voucher, now);
        const assignmentExpired = this.isUserVoucherExpired(record, now);
        const usageExceeded =
          Number(record.usageCount || 0) >= Number(record.maxUsage || 1);

        let status = record.status || "UNUSED";
        if (voucherExpired || assignmentExpired) {
          status = "EXPIRED";
          expiredIds.push(record._id);
        } else if (usageExceeded) {
          status = "USED";
        }

        return {
          _id: record._id,
          assignedAt: record.assignedAt,
          usedAt: record.usedAt,
          usageCount: Number(record.usageCount || 0),
          maxUsage: Number(record.maxUsage || 1),
          status,
          canUse: status === "UNUSED" && voucher.isActive,
          voucher,
        };
      });

    if (expiredIds.length > 0) {
      await UserVoucher.updateMany(
        { _id: { $in: expiredIds }, status: { $ne: "EXPIRED" } },
        { $set: { status: "EXPIRED" } },
      );
    }

    return items;
  }

  async buildCustomerOrderStats(userIds) {
    const stats = await Order.aggregate([
      {
        $match: {
          user: { $in: userIds },
          orderStatus: { $ne: "CANCELLED" },
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);

    const statsMap = new Map();
    stats.forEach((entry) => {
      statsMap.set(String(entry._id), {
        orderCount: Number(entry.orderCount || 0),
        totalSpent: Number(entry.totalSpent || 0),
        lastOrderAt: entry.lastOrderAt || null,
      });
    });

    return statsMap;
  }

  async collectSegmentUserIds(segments = [], segmentRules = {}) {
    if (!Array.isArray(segments) || segments.length === 0) {
      return new Set();
    }

    const normalizedSegments = [...new Set(segments.filter(Boolean))];
    const customers = await User.find({ role: "customer", isActive: true })
      .select("_id createdAt birthDate")
      .lean();

    const customerIds = customers.map((customer) => customer._id);
    const statsMap = await this.buildCustomerOrderStats(customerIds);

    const now = new Date();
    const currentMonth = now.getMonth();
    const vipMinSpent = Number(segmentRules.vipMinSpent || 3000000);
    const inactiveDays = Number(segmentRules.inactiveDays || 90);
    const minOrderCount = Number(segmentRules.minOrderCount || 5);
    const inactiveBoundary = new Date(
      now.getTime() - inactiveDays * 24 * 60 * 60 * 1000,
    );

    const results = new Set();

    for (const customer of customers) {
      const id = String(customer._id);
      const stat = statsMap.get(id) || {
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      for (const segment of normalizedSegments) {
        if (segment === SEGMENT_TYPES.NEW_CUSTOMER && stat.orderCount === 0) {
          results.add(id);
        }

        if (
          segment === SEGMENT_TYPES.VIP_CUSTOMER &&
          stat.totalSpent >= vipMinSpent
        ) {
          results.add(id);
        }

        if (segment === SEGMENT_TYPES.INACTIVE_CUSTOMER) {
          if (
            !stat.lastOrderAt ||
            new Date(stat.lastOrderAt) < inactiveBoundary
          ) {
            results.add(id);
          }
        }

        if (
          segment === SEGMENT_TYPES.BIRTHDAY_THIS_MONTH &&
          customer.birthDate &&
          new Date(customer.birthDate).getMonth() === currentMonth
        ) {
          results.add(id);
        }

        if (
          segment === SEGMENT_TYPES.PURCHASED_OVER_X &&
          stat.orderCount >= minOrderCount
        ) {
          results.add(id);
        }
      }
    }

    return results;
  }

  async assignVoucherToUsers(voucherId, payload = {}) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw ApiError.notFound("Voucher not found");
    }

    const manualUserIds = Array.isArray(payload.userIds)
      ? payload.userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    const segmentUserIds = await this.collectSegmentUserIds(
      payload.segments,
      payload.segmentRules,
    );

    const finalIds = new Set([
      ...manualUserIds.map((id) => String(id)),
      ...Array.from(segmentUserIds),
    ]);

    if (finalIds.size === 0) {
      throw ApiError.badRequest("No eligible users selected for assignment");
    }

    const users = await User.find({
      _id: { $in: Array.from(finalIds) },
      role: "customer",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (users.length === 0) {
      throw ApiError.badRequest("No valid customer users found for assignment");
    }

    const maxUsage = Number(voucher.maxUsagePerUser || 1);
    const expiresAt = voucher.expiryDate || null;

    const bulkOps = users.map((user) => ({
      updateOne: {
        filter: {
          user: user._id,
          voucher: voucher._id,
        },
        update: {
          $setOnInsert: {
            assignedAt: new Date(),
            status: "UNUSED",
            usageCount: 0,
            usedAt: null,
          },
          $set: {
            expiresAt,
            maxUsage,
          },
        },
        upsert: true,
      },
    }));

    const writeResult = await UserVoucher.bulkWrite(bulkOps, {
      ordered: false,
    });

    await Voucher.findByIdAndUpdate(voucher._id, {
      $set: {
        audienceType: "ASSIGNED",
      },
    });

    const assignedCount = Number(writeResult.upsertedCount || 0);
    const targetCount = users.length;

    return {
      voucherId: voucher._id,
      targetCount,
      assignedCount,
      alreadyAssignedCount: Math.max(targetCount - assignedCount, 0),
      audienceType: "ASSIGNED",
    };
  }

  validateVoucherPayload(payload, isCreate = false) {
    const discountType = payload.discountType;
    const discountValue = payload.discountValue;

    if (isCreate && !payload.code) {
      throw ApiError.badRequest("Voucher code is required");
    }

    if (isCreate && !payload.expiryDate) {
      throw ApiError.badRequest("Expiry date is required");
    }

    if (discountType && !["PERCENT", "FIXED"].includes(discountType)) {
      throw ApiError.badRequest("Discount type must be PERCENT or FIXED");
    }

    if (discountValue !== undefined) {
      const normalizedDiscount = Number(discountValue);
      if (!Number.isFinite(normalizedDiscount) || normalizedDiscount <= 0) {
        throw ApiError.badRequest("Discount value must be greater than 0");
      }

      if (
        (discountType || "PERCENT") === "PERCENT" &&
        normalizedDiscount > 100
      ) {
        throw ApiError.badRequest("Percent discount cannot exceed 100");
      }
    }

    if (payload.expiryDate !== undefined) {
      const expiryDate = new Date(payload.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        throw ApiError.badRequest("Invalid expiry date");
      }
    }

    if (
      payload.minOrderValue !== undefined &&
      Number(payload.minOrderValue) < 0
    ) {
      throw ApiError.badRequest("Minimum order value cannot be negative");
    }

    if (
      payload.maxDiscountValue !== undefined &&
      payload.maxDiscountValue !== null &&
      Number(payload.maxDiscountValue) < 0
    ) {
      throw ApiError.badRequest("Max discount value cannot be negative");
    }

    if (
      payload.audienceType !== undefined &&
      !["PUBLIC", "ASSIGNED"].includes(payload.audienceType)
    ) {
      throw ApiError.badRequest("Audience type must be PUBLIC or ASSIGNED");
    }

    if (payload.maxUsagePerUser !== undefined) {
      const maxUsagePerUser = Number(payload.maxUsagePerUser);
      if (!Number.isInteger(maxUsagePerUser) || maxUsagePerUser < 1) {
        throw ApiError.badRequest(
          "Max usage per user must be an integer greater than 0",
        );
      }
    }
  }
}

export default new VoucherService();
