import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenHelper.js';
import { MESSAGES } from '../config/constants.js';
import { sendOTPEmail, sendPasswordResetConfirmationEmail } from '../utils/emailHelper.js';

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

    // Check if account is active
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been locked. Please contact support.');
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

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal if email exists
      return true;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiry on user (expires in 10 minutes)
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email with OTP
    await this.sendOTPEmail(email, otp);

    return true;
  }

  async verifyOTP(email, otp) {
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.otp || !user.otpExpires) {
      throw ApiError.badRequest('No OTP request found. Please request a new OTP');
    }

    if (user.otpExpires < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please request a new one');
    }

    if (user.otp !== otp) {
      throw ApiError.badRequest('Invalid OTP');
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { userId: user._id, email: user.email };
  }

  async resetPasswordWithOTP(email, newPassword) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send confirmation email
    try {
      const userName = `${user.firstName} ${user.lastName}`.trim();
      await sendPasswordResetConfirmationEmail(email, userName);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw error here - password was already reset successfully
    }

    return true;
  }

  async sendOTPEmail(email, otp) {
    try {
      // Get user to access their name
      const user = await User.findOne({ email });
      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
      
      // Send OTP email using email helper
      await sendOTPEmail(email, otp, userName);
      
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw ApiError.internalServerError('Failed to send OTP email. Please try again.');
    }
  }
}

export default new AuthService();