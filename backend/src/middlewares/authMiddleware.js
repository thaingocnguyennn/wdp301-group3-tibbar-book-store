import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokenHelper.js';
import { MESSAGES } from '../config/constants.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
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

    // Check if user account is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been locked. Please contact support.');
    }

    req.user = {
      userId: decoded.userId,
      role: user.role // Use the role from database to ensure it's up-to-date
    };

    next();
  } catch (error) {
    next(error);
  }
};