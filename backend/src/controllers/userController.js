import userService from '../services/userService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

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

}

export default new UserController();