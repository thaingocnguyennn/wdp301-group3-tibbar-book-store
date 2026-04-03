import flashSaleService from "../services/flashSaleService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

// Controller để lấy thông tin flash sale đang hoạt động (cho người dùng thường)
class FlashSaleController {
  // API: Lấy chiến dịch flash sale hiện tại cùng các cài đặt
  async getActiveFlashSale(req, res, next) {
    try {
      // Lấy thông tin chiến dịch flash sale đang hoạt động
      const campaign = await flashSaleService.getActiveFlashSale();
      // Lấy các cài đặt cho flash sale (giảm giá min/max, thời lượng, etc.)
      const settings = flashSaleService.getSettings();

      // Trả về thông tin chiến dịch và cài đặt cho frontend
      return ApiResponse.success(res, HTTP_STATUS.OK, "Flash sale fetched", {
        campaign,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FlashSaleController();
