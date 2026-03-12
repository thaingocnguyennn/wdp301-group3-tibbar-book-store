import User from '../models/User.js';
import CoinTransaction from '../models/CoinTransaction.js';
import ApiError from '../utils/ApiError.js';

class CoinService {
  // Constants for coin rewards
  static DAILY_CHECKIN_REWARD = 100;
  static STREAK_BONUS_REWARD = 200; // Reward on 7th day
  static STREAK_RESET_DAY = 7;

  /**
   * Check if user can check in today
   */
  canCheckInToday(lastCheckIn) {
    if (!lastCheckIn) return true;

    const now = new Date();
    const lastCheckInDate = new Date(lastCheckIn);

    // Set both dates to start of day for comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheckInStart = new Date(
      lastCheckInDate.getFullYear(),
      lastCheckInDate.getMonth(),
      lastCheckInDate.getDate()
    );

    // Can check in if last check-in was before today
    return todayStart > lastCheckInStart;
  }

  /**
   * Calculate if the streak continues or breaks
   */
  calculateStreak(lastCheckIn, currentStreak) {
    if (!lastCheckIn) return 1; // First check-in

    const now = new Date();
    const lastCheckInDate = new Date(lastCheckIn);

    // Calculate days difference
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheckInStart = new Date(
      lastCheckInDate.getFullYear(),
      lastCheckInDate.getMonth(),
      lastCheckInDate.getDate()
    );

    const daysDiff = Math.floor((todayStart - lastCheckInStart) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      const newStreak = currentStreak + 1;
      // Reset to 1 after completing 7-day streak
      return newStreak > CoinService.STREAK_RESET_DAY ? 1 : newStreak;
    } else {
      // Streak broken - reset to 1
      return 1;
    }
  }

  /**
   * Calculate coin reward based on streak
   */
  calculateReward(newStreak) {
    if (newStreak === CoinService.STREAK_RESET_DAY) {
      return CoinService.STREAK_BONUS_REWARD;
    }
    return CoinService.DAILY_CHECKIN_REWARD;
  }

  /**
   * Perform daily check-in
   */
  async dailyCheckIn(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if user already checked in today
    if (!this.canCheckInToday(user.lastCheckIn)) {
      throw ApiError.badRequest('You have already checked in today. Come back tomorrow!');
    }

    // Calculate new streak
    const newStreak = this.calculateStreak(user.lastCheckIn, user.checkInStreak);

    // Calculate reward
    const reward = this.calculateReward(newStreak);

    // Update user
    user.coinBalance += reward;
    user.lastCheckIn = new Date();
    user.checkInStreak = newStreak;
    await user.save();

    // Create transaction record
    const description = newStreak === CoinService.STREAK_RESET_DAY
      ? `Daily check-in bonus (7-day streak completed!)`
      : `Daily check-in bonus (Day ${newStreak})`;

    await CoinTransaction.create({
      userId: user._id,
      type: 'CHECKIN',
      amount: reward,
      description,
      balanceAfter: user.coinBalance
    });

    return {
      reward,
      newBalance: user.coinBalance,
      currentStreak: newStreak,
      nextCheckInDate: this.getNextCheckInDate()
    };
  }

  /**
   * Get next available check-in date
   */
  getNextCheckInDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Deduct coins from user (used during order checkout)
   */
  async deductCoins(userId, amount, orderId, description) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.coinBalance < amount) {
      throw ApiError.badRequest('Insufficient coin balance');
    }

    user.coinBalance -= amount;
    await user.save();

    await CoinTransaction.create({
      userId: user._id,
      type: 'ORDER_DISCOUNT',
      amount: -amount, // Negative for deduction
      description,
      orderId,
      balanceAfter: user.coinBalance
    });

    return user.coinBalance;
  }

  /**
   * Add coins to user (admin adjustment or refund)
   */
  async addCoins(userId, amount, description, type = 'ADMIN_ADJUST') {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.coinBalance += amount;
    await user.save();

    await CoinTransaction.create({
      userId: user._id,
      type,
      amount,
      description,
      balanceAfter: user.coinBalance
    });

    return user.coinBalance;
  }

  /**
   * Get user's coin transaction history
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ userId })
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CoinTransaction.countDocuments({ userId })
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get user's coin balance and check-in status
   */
  async getCoinStatus(userId) {
    const user = await User.findById(userId).select('coinBalance lastCheckIn checkInStreak');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const canCheckIn = this.canCheckInToday(user.lastCheckIn);

    return {
      coinBalance: user.coinBalance,
      lastCheckIn: user.lastCheckIn,
      currentStreak: user.checkInStreak,
      canCheckInToday: canCheckIn,
      nextCheckInDate: canCheckIn ? new Date() : this.getNextCheckInDate()
    };
  }

  /**
   * Calculate maximum coins that can be used for an order
   */
  calculateMaxCoinsUsable(userCoinBalance, orderTotal) {
    return Math.min(userCoinBalance, orderTotal);
  }
}

export default new CoinService();
