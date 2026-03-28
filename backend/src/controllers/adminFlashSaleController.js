import flashSaleService from "../services/flashSaleService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminFlashSaleController {
  async getCurrentFlashSale(req, res, next) {
    try {
      const campaign = await flashSaleService.getActiveFlashSale();
      const settings = flashSaleService.getSettings();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Current flash sale fetched", {
        campaign,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async upsertFlashSale(req, res, next) {
    try {
      const campaign = await flashSaleService.upsertCurrentFlashSale(req.body, req.user?._id);
      const settings = flashSaleService.getSettings();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Flash sale saved", {
        campaign,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearFlashSale(req, res, next) {
    try {
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
