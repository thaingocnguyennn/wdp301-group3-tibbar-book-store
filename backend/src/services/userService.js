import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES, ROLES } from '../config/constants.js';
import Order from "../models/Order.js";
import orderService from "./orderService.js";
class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const { email, password, role, ...allowedUpdates } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return user;
  }

  async getAllUsers({ role, status, search } = {}) {
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status) {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'locked') {
        filter.isActive = false;
      }
      // If status is 'all', don't add any filter
    }

    // Search by email, firstName, or lastName
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    return users;
  }

  async updateUserRole(userId, newRole) {
    if (!Object.values(ROLES).includes(newRole)) {
      throw ApiError.badRequest('Invalid role specified');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role: newRole } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return user;
  }

  async toggleUserStatus(userId, currentUserId) {
    const user = await User.findById(userId).select('+refreshToken');

    if (!user) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // Prevent user from locking their own account
    if (userId === currentUserId) {
      throw ApiError.badRequest('You cannot lock your own account');
    }

    user.isActive = !user.isActive;

    // If locking the account, clear refresh token to invalidate session
    if (!user.isActive) {
      user.refreshToken = null;
    }

    await user.save();

    return user;
  }
  async getShippers() {
    // 1️⃣ Lấy danh sách shipper
    const shippers = await User.find({ role: "shipper" })
      .select("email role createdAt")
      .sort({ createdAt: -1 });

    const shipperIds = shippers.map(s => s._id);

    // 2️⃣ Đếm tổng số order đã được assign cho shipper
    const orderCounts = await Order.aggregate([
      {
        $match: {
          shipper: { $in: shipperIds }
        }
      },
      {
        $group: {
          _id: "$shipper",
          total: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    orderCounts.forEach(item => {
      countMap[item._id.toString()] = item.total;
    });

    // 🔥 3️⃣ TÍNH PERFORMANCE CHO TỪNG SHIPPER
    const result = [];

    for (const shipper of shippers) {

      const performance = await orderService.getShipperPerformance(shipper._id);

      result.push({
        ...shipper.toObject(),
        assignedOrders: countMap[shipper._id.toString()] || 0,
        acceptanceRate: performance.acceptanceRate,
        successRate: performance.successRate
      });
    }

    return result;
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

}

export default new UserService();