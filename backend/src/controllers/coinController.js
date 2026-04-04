import coinService from '../services/coinService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

class CoinController {
  /**
   * Daily check-in endpoint
   * POST /api/coins/check-in
   */
  //hàm xử lý khi người dùng thực hiện check-in hàng ngày để nhận coin
  async checkIn(req, res, next) {
    try {
      // Lấy user ID từ token đã xác thực trong middleware authMiddleware
      const userId = req.user._id;

      // Gọi service để thực hiện logic check-in hàng ngày, trả về kết quả (số coin nhận được, trạng thái check-in, v.v.)
      const result = await coinService.dailyCheckIn(userId);

      // Trả về phản hồi thành công với dữ liệu kết quả từ service
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
  //hàm xử lý khi người dùng yêu cầu xem trạng thái coin hiện tại của họ (số dư coin, trạng thái check-in hôm nay đã thực hiện hay chưa, v.v.)
  async getCoinStatus(req, res, next) {
    try {
      // Lấy user ID từ token đã xác thực trong middleware authMiddleware
      const userId = req.user._id;

      // Gọi service để lấy thông tin trạng thái coin của người dùng
      const status = await coinService.getCoinStatus(userId);

      // Trả về phản hồi thành công với dữ liệu trạng thái coin
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
  //hàm xử lý khi người dùng yêu cầu xem lịch sử giao dịch coin của họ, hỗ trợ phân trang và lọc theo loại giao dịch
  async getTransactionHistory(req, res, next) {
    try {
      // Lấy user ID từ token đã xác thực trong middleware authMiddleware
      const userId = req.user._id;
      // Lấy thông tin phân trang và lọc từ query parameters (nếu có), với giá trị mặc định nếu không cung cấp
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Gọi service để lấy lịch sử giao dịch coin của người dùng với phân trang và lọc
      const result = await coinService.getTransactionHistory(userId, page, limit);

      // Trả về phản hồi thành công với dữ liệu lịch sử giao dịch đã được phân trang
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
}

export default new CoinController();
