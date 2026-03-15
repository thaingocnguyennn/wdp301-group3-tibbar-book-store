import userService from '../services/userService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';
import bookService from '../services/bookService.js';
class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.PROFILE_FETCHED,
        { user }
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.userId, req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.PROFILE_UPDATED,
        { user }
      );
    } catch (error) {
      next(error);
    }
  }
  getShippers = async (req, res, next) => {
    try {
      const shippers = await userService.getShippers();
      res.json({ shippers });
    } catch (err) {
      next(err);
    }
  };

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Current password and new password are required'
        );
      }

      const result = await userService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        result.message
      );
    } catch (error) {
      next(error);
    }
  }
  async getRecentlyViewed(req, res, next) {
    try {
      const books = await bookService.getRecentlyViewed(req.user.userId);

      return ApiResponse.success(
        res,
        200,
        "Recently viewed fetched",
        { books }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();