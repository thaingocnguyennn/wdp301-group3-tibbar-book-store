import voucherService from "../services/voucherService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class VoucherController {
  /**
   * GET /api/vouchers/available?subtotal=<number>
   * Returns active, non-expired vouchers that the user's current cart subtotal satisfies.
   */
  async getAvailableVouchers(req, res, next) {
    try {
      // UC-92: Trả danh sách voucher còn hiệu lực tại thời điểm checkout.
      // userId giúp backend gộp thêm voucher ASSIGNED của user (nếu có).
      const userId = req.user?._id || null;
      // subtotal lấy từ query để backend lọc voucher đủ điều kiện minOrderValue.
      const subtotal = Number(req.query.subtotal) || 0;
      const vouchers = await voucherService.getAvailableVouchers(
        subtotal,
        userId,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Available vouchers retrieved successfully",
        { vouchers },
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyVouchers(req, res, next) {
    try {
      // UC-91 + UC-93: Trả ví voucher cá nhân (usage/status + voucher assigned).
      // Dữ liệu usage history gồm usedAt, usageCount, maxUsage; discount amount nằm ở voucher/order khi áp dụng.
      const userId = req.user._id;
      const vouchers = await voucherService.getUserVoucherWallet(userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "My vouchers retrieved successfully",
        { vouchers },
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new VoucherController();
