import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenHelper.js';
import { MESSAGES } from '../config/constants.js';

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict(MESSAGES.EMAIL_EXISTS);
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async refreshAccessToken(oldRefreshToken) {
    const decoded = verifyRefreshToken(oldRefreshToken);
    
    if (!decoded) {
      throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== oldRefreshToken) {
      throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }
}

export default new AuthService();