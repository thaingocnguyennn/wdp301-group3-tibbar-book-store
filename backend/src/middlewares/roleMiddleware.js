import ApiError from '../utils/ApiError.js';
import { MESSAGES } from '../config/constants.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ApiError.forbidden(MESSAGES.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};