import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokenHelper.js";
import { MESSAGES } from "../config/constants.js";
import User from "../models/User.js";

const buildRequestUser = (user) => ({
  _id: user._id,
  userId: user._id, // Keep for backward compatibility
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
});

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
      throw ApiError.forbidden(
        "Your account has been locked. Please contact support.",
      );
    }

    // Attach full user object to request for easier access
    req.user = buildRequestUser(user);

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return next();
    }

    if (!decoded?.userId) {
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next();
    }

    req.user = buildRequestUser(user);

    next();
  } catch (error) {
    next(error);
  }
};
