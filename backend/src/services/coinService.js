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
  //hàm kiểm tra xem người dùng đã thực hiện check-in hôm nay chưa, dựa trên thông tin lastCheckIn trong cơ sở dữ liệu
  canCheckInToday(lastCheckIn) {
    // Nếu lastCheckIn chưa có, nghĩa là chưa từng check-in, nên có thể check-in được
    if (!lastCheckIn) return true;

    // So sánh ngày hiện tại với ngày của lastCheckIn để xác định xem đã check-in hôm nay chưa
    const now = new Date();
    // Chuyển lastCheckIn thành đối tượng Date nếu nó là chuỗi
    const lastCheckInDate = new Date(lastCheckIn);

    // Tạo đối tượng Date chỉ chứa phần ngày (không có giờ, phút, giây) để so sánh
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Tạo đối tượng Date chỉ chứa phần ngày của lastCheckIn
    const lastCheckInStart = new Date(
      lastCheckInDate.getFullYear(),
      lastCheckInDate.getMonth(),
      lastCheckInDate.getDate()
    );

    // Nếu todayStart lớn hơn lastCheckInStart, nghĩa là đã qua ngày mới và có thể check-in được
    return todayStart > lastCheckInStart;
  }

  //hàm tính toán chuỗi check-in liên tiếp của người dùng dựa trên ngày check-in cuối cùng và chuỗi hiện tại
  // , để xác định phần thưởng coin tương ứng
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

  //hàm tính toán phần thưởng coin dựa trên chuỗi check-in liên tiếp mới, với phần thưởng cao hơn khi đạt chuỗi 7 ngày
  calculateReward(newStreak) {
    // Nếu đạt chuỗi 7 ngày, trả về phần thưởng bonus, ngược lại trả về phần thưởng check-in hàng ngày
    if (newStreak === CoinService.STREAK_RESET_DAY) {
      // Nếu đạt chuỗi 7 ngày, trả về phần thưởng bonus
      return CoinService.STREAK_BONUS_REWARD;
    }
    // Ngược lại, trả về phần thưởng check-in hàng ngày
    return CoinService.DAILY_CHECKIN_REWARD;
  }

  //hàm xử lý khi người dùng thực hiện check-in hàng ngày để kiếm coin,
  //  bao gồm kiểm tra điều kiện check-in, tính toán phần thưởng dựa trên chuỗi check-in liên tiếp,
  //  cập nhật số dư coin và tạo bản ghi giao dịch
  async dailyCheckIn(userId) {
    // Lấy user từ cơ sở dữ liệu để kiểm tra và cập nhật thông tin check-in
    const user = await User.findById(userId);
    // Nếu không tìm thấy user, trả về lỗi
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Kiểm tra xem user đã check-in hôm nay chưa, nếu rồi thì trả về lỗi
    if (!this.canCheckInToday(user.lastCheckIn)) {
      throw ApiError.badRequest('You have already checked in today. Come back tomorrow!');
    }

    // Tính toán chuỗi check-in liên tiếp mới dựa trên ngày check-in cuối cùng và chuỗi hiện tại của user
    const newStreak = this.calculateStreak(user.lastCheckIn, user.checkInStreak);

    // Tính toán phần thưởng coin dựa trên chuỗi check-in liên tiếp mới
    const reward = this.calculateReward(newStreak);

    // Cập nhật số dư coin, ngày check-in cuối cùng và chuỗi check-in liên tiếp của user trong cơ sở dữ liệu
    user.coinBalance += reward;
    user.lastCheckIn = new Date();
    user.checkInStreak = newStreak;
    await user.save();

    // Tạo bản ghi giao dịch coin cho hoạt động check-in này, 
    // bao gồm loại giao dịch, số lượng coin, mô tả và số dư sau giao dịch
    const description = newStreak === CoinService.STREAK_RESET_DAY
      ? `Daily check-in bonus (7-day streak completed!)`
      : `Daily check-in bonus (Day ${newStreak})`;

      // Tạo bản ghi giao dịch coin cho hoạt động check-in này
    await CoinTransaction.create({
      userId: user._id,
      type: 'CHECKIN',
      amount: reward,
      description,
      balanceAfter: user.coinBalance
    });

    // Trả về kết quả bao gồm phần thưởng nhận được, số dư coin mới, 
    // chuỗi check-in hiện tại, và ngày có thể check-in tiếp theo
    return {
      reward,
      newBalance: user.coinBalance,
      currentStreak: newStreak,
      nextCheckInDate: this.getNextCheckInDate()
    };
  }

  //hàm tính toán ngày có thể check-in tiếp theo, thường là ngày hôm sau vào lúc 00:00:00
  getNextCheckInDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  //hàm xử lý khi admin muốn trừ coin từ tài khoản của một người dùng, yêu cầu cung cấp user ID, 
  // số lượng coin cần trừ, order ID liên quan (nếu có), và mô tả lý do
  async deductCoins(userId, amount, orderId, description) {
    // Lấy user từ cơ sở dữ liệu để kiểm tra và cập nhật số dư coin
    const user = await User.findById(userId);
    // Nếu không tìm thấy user, trả về lỗi
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Kiểm tra nếu số dư coin của user không đủ để trừ, trả về lỗi
    if (user.coinBalance < amount) {
      throw ApiError.badRequest('Insufficient coin balance');
    }

    user.coinBalance -= amount;
    await user.save();

    // Tạo bản ghi giao dịch coin cho hoạt động trừ coin này, bao gồm loại giao dịch, 
    // số lượng coin, mô tả, order ID liên quan (nếu có), và số dư sau giao dịch
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

  //hàm lấy lịch sử giao dịch coin của người dùng với phân trang và lọc theo loại giao dịch
  // trả về kết quả đã được phân trang
  async getTransactionHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Truy vấn đồng thời để lấy danh sách giao dịch đã phân trang và tổng số giao dịch để tính toán phân trang
    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ userId })
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CoinTransaction.countDocuments({ userId })
    ]);

    // Trả về kết quả bao gồm danh sách giao dịch đã phân trang và thông tin phân trang
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

  //hàm lấy coin status của người dùng
  async getCoinStatus(userId) {
    // Lấy user từ cơ sở dữ liệu để lấy thông tin trạng thái coin
    const user = await User.findById(userId).select('coinBalance lastCheckIn checkInStreak');
    // Nếu không tìm thấy user, trả về lỗi
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Tính toán xem user có thể check-in hôm nay hay không dựa trên thông tin lastCheckIn
    const canCheckIn = this.canCheckInToday(user.lastCheckIn);

    // Trả về kết quả bao gồm số dư coin, trạng thái check-in hôm nay, 
    // chuỗi check-in hiện tại, và ngày có thể check-in tiếp theo
    return {
      coinBalance: user.coinBalance,
      lastCheckIn: user.lastCheckIn,
      currentStreak: user.checkInStreak,
      canCheckInToday: canCheckIn,
      nextCheckInDate: canCheckIn ? new Date() : this.getNextCheckInDate()
    };
  }

  //hàm tính toán số coin tối đa có thể sử dụng cho một đơn hàng 
  // dựa trên số dư coin của người dùng và tổng giá trị đơn hàng
  calculateMaxCoinsUsable(userCoinBalance, orderTotal) {
    return Math.min(userCoinBalance, orderTotal);
  }
}

export default new CoinService();
