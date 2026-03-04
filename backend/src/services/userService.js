import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES, ROLES } from '../config/constants.js';
import Order from "../models/Order.js";

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
    const shippers = await User.find({ role: "shipper" }) // Chỉ lấy những user có role là "shipper"
      .select("email role createdAt")// Chỉ lấy những trường cần thiết để trả về cho client, tránh trả về thông tin nhạy cảm như password, refreshToken, v.v.
      .sort({ createdAt: -1 });// Sắp xếp theo ngày tạo mới nhất trước để shipper mới được tạo sẽ hiển thị ở đầu danh sách

    const shipperIds = shippers.map(s => s._id);// Lấy danh sách shipperId để dùng cho bước tiếp theo

    // 2️⃣ Đếm số order theo shipper
    const orderCounts = await Order.aggregate([// Sử dụng aggregation để đếm số lượng đơn hàng đã được giao thành công (DELIVERED) cho mỗi shipper
      {
        $match: {// Lọc các order có shipper thuộc danh sách shipper
          shipper: { $in: shipperIds }// Chỉ tính những đơn hàng có shipper là một trong những shipper trong danh sách shipperIds
        }
      },
      {
        $group: { //Gom theo shipper và đếm tổng số đơn
          _id: "$shipper",
          total: { $sum: 1 }
        }
      }
    ]);

    // 3️⃣ Map shipperId → total orders convert thành map 
    const countMap = {};// Tạo một object để map shipperId với tổng số đơn hàng đã giao thành công của shipper đó, key là shipperId và value là tổng số đơn hàng
    orderCounts.forEach(item => {// Duyệt qua kết quả đếm số đơn hàng theo shipper và lưu vào countMap để dễ lookup khi gộp dữ liệu với danh sách shipper
      countMap[item._id.toString()] = item.total;
    });

    // 4️⃣ Gộp dữ liệu
    return shippers.map(shipper => ({
      ...shipper.toObject(),
      assignedOrders: countMap[shipper._id.toString()] || 0
    }));
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