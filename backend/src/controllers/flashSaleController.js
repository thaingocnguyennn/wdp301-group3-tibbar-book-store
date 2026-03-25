import flashSaleService from "../services/flashSaleService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class FlashSaleController {
  async getActiveFlashSale(req, res, next) {
    try {
      const campaign = await flashSaleService.getActiveFlashSale();
      const settings = flashSaleService.getSettings();

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
