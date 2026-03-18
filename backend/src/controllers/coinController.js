import coinService from '../services/coinService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

class CoinController {
  /**
   * Daily check-in endpoint
   * POST /api/coins/check-in
   */
  async checkIn(req, res, next) {
    try {
      const userId = req.user._id;

      const result = await coinService.dailyCheckIn(userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Check-in successful!',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's coin status
   * GET /api/coins/status
   */
  async getCoinStatus(req, res, next) {
    try {
      const userId = req.user._id;

      const status = await coinService.getCoinStatus(userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Coin status retrieved successfully',
        status
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history
   * GET /api/coins/transactions
   */
  async getTransactionHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await coinService.getTransactionHistory(userId, page, limit);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Transaction history retrieved successfully',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Add coins to user
   * POST /api/admin/coins/add
   */
  async adminAddCoins(req, res, next) {
    try {
      const { userId, amount, description } = req.body;

      if (!userId || !amount || !description) {
        throw ApiError.badRequest('User ID, amount, and description are required');
      }

      if (amount <= 0) {
        throw ApiError.badRequest('Amount must be positive');
      }

      const newBalance = await coinService.addCoins(
        userId,
        amount,
        description,
        'ADMIN_ADJUST'
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Coins added successfully',
        { newBalance }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Deduct coins from user
   * POST /api/admin/coins/deduct
   */
  async adminDeductCoins(req, res, next) {
    try {
      const { userId, amount, description } = req.body;

      if (!userId || !amount || !description) {
        throw ApiError.badRequest('User ID, amount, and description are required');
      }

      if (amount <= 0) {
        throw ApiError.badRequest('Amount must be positive');
      }

      const newBalance = await coinService.deductCoins(
        userId,
        amount,
        null, // No order ID for admin adjustment
        description
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Coins deducted successfully',
        { newBalance }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new CoinController();
