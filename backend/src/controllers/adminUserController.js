import userService from '../services/userService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

class AdminUserController {
  async getAllUsers(req, res, next) {
    try {
      const { role, status, search } = req.query;
      const users = await userService.getAllUsers({ role, status, search });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Users retrieved successfully',
        { users }
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await userService.updateUserRole(userId, role);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'User role updated successfully',
        { user }
      );
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;

      const user = await userService.toggleUserStatus(userId, currentUserId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        `User account ${user.isActive ? 'unlocked' : 'locked'} successfully`,
        { user }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminUserController();
