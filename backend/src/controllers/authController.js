import authService from '../services/authService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/tokenHelper.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const { user, accessToken, refreshToken } = await authService.register({
        email,
        password,
        firstName,
        lastName
      });

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        MESSAGES.REGISTER_SUCCESS,
        { user, accessToken }
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const { user, accessToken, refreshToken } = await authService.login(email, password);

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.LOGIN_SUCCESS,
        { user, accessToken }
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.userId);

      clearRefreshTokenCookie(res);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.LOGOUT_SUCCESS
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;

      if (!oldRefreshToken) {
        throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
      }

      const { accessToken, refreshToken } = await authService.refreshAccessToken(oldRefreshToken);

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.TOKEN_REFRESHED,
        { accessToken }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();