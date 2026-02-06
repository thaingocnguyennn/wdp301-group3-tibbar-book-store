import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES, ROLES } from '../config/constants.js';

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
    return User.find({ role: "shipper" })
      .select("email role createdAt")
      .sort({ createdAt: -1 });
  }

}

export default new UserService();