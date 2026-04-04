import ApiError from '../utils/ApiError.js';
import { MESSAGES } from '../config/constants.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // UC-24/25/26/47/48/93: Route admin dùng middleware này để chặn người không phải admin.
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