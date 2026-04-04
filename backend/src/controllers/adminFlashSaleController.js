import flashSaleService from "../services/flashSaleService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

// Controller để quản lý flash sale (chỉ dành cho Admin)
class AdminFlashSaleController {
  // API: Lấy chiến dịch flash sale hiện tại
  async getCurrentFlashSale(req, res, next) {
    try {
      // Lấy chiến dịch flash sale đang hoạt động
      const campaign = await flashSaleService.getActiveFlashSale();
      // Lấy các cài đặt
      const settings = flashSaleService.getSettings();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Current flash sale fetched", {
        campaign,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  // API: Tạo mới hoặc cập nhật chiến dịch flash sale
  async upsertFlashSale(req, res, next) {
    try {
      // Tạo/cập nhật chiến dịch flash sale với dữ liệu từ request body
      const campaign = await flashSaleService.upsertCurrentFlashSale(req.body, req.user?._id);
      // Lấy các cài đặt
      const settings = flashSaleService.getSettings();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Flash sale saved", {
        campaign,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  // API: Xóa/hủy chiến dịch flash sale hiện tại
  async clearFlashSale(req, res, next) {
    try {
      // Hủy tất cả chiến dịch flash sale đang hoạt động
      const clearedCount = await flashSaleService.clearCurrentFlashSale();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Flash sale cleared", {
        clearedCount,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminFlashSaleController();
