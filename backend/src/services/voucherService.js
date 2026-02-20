import Voucher from "../models/Voucher.js";
import ApiError from "../utils/ApiError.js";

class VoucherService {
  async getAllVouchers() {
    return Voucher.find({}).sort({ createdAt: -1 }).lean();
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

    return voucher;
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

      if ((discountType || "PERCENT") === "PERCENT" && normalizedDiscount > 100) {
        throw ApiError.badRequest("Percent discount cannot exceed 100");
      }
    }

    if (payload.expiryDate !== undefined) {
      const expiryDate = new Date(payload.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        throw ApiError.badRequest("Invalid expiry date");
      }
    }

    if (payload.minOrderValue !== undefined && Number(payload.minOrderValue) < 0) {
      throw ApiError.badRequest("Minimum order value cannot be negative");
    }

    if (
      payload.maxDiscountValue !== undefined &&
      payload.maxDiscountValue !== null &&
      Number(payload.maxDiscountValue) < 0
    ) {
      throw ApiError.badRequest("Max discount value cannot be negative");
    }
  }
}

export default new VoucherService();
