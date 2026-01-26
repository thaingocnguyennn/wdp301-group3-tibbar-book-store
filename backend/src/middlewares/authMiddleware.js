import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokenHelper.js';
import { MESSAGES } from '../config/constants.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(error);
  }
};