import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenHelper.js';
import { MESSAGES } from '../config/constants.js';
import { sendOTPEmail, sendPasswordResetConfirmationEmail } from '../utils/emailHelper.js';
import { OAuth2Client } from 'google-auth-library';

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

  async googleLogin(idToken) {
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        throw ApiError.internalServerError('Google Client ID is not configured');
      }

      // Verify the ID token using google-auth-library
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw ApiError.unauthorized('Invalid Google ID token');
      }

      const { email, given_name, family_name, picture, sub: googleId } = payload;

      if (!email || !googleId) {
        throw ApiError.badRequest('Invalid Google profile data');
      }

      // Check if user exists with this email
      let user = await User.findOne({ email });

      if (user) {
        // User exists - link Google ID if not already linked
        if (!user.googleId) {
          user.googleId = googleId;
          user.provider = 'google';
          if (picture && !user.avatar) {
            user.avatar = picture;
          }
          await user.save();
        }
      } else {
        // Create new user from Google profile
        user = await User.create({
          email,
          googleId,
          firstName: given_name || '',
          lastName: family_name || '',
          avatar: picture || null,
          provider: 'google',
          password: null // Google users don't have passwords
        });
      }

      // Check if account is active
      if (!user.isActive) {
        throw ApiError.forbidden('Your account has been locked. Please contact support.');
      }

      // Generate our own JWT tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      return { user, accessToken, refreshToken };
    } catch (error) {
      if (error.name === 'TokenPayloadError' || error.message.includes('Invalid token')) {
        throw ApiError.unauthorized('Invalid or expired Google token');
      }
      throw error;
    }
  }
}

export default new AuthService();