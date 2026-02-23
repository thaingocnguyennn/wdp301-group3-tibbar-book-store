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
      const subtotal = Number(req.query.subtotal) || 0;
      const vouchers = await voucherService.getAvailableVouchers(subtotal);

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
}

export default new VoucherController();
