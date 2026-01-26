import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES } from '../config/constants.js';

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
}

export default new UserService();