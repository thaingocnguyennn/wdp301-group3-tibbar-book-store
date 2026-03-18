import sliderService from "../services/sliderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class SliderController {
  async getPublicSliders(req, res, next) {
    try {
      const sliders = await sliderService.getPublicSliders();
      return ApiResponse.success(res, HTTP_STATUS.OK, "Sliders fetched", {
        sliders,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SliderController();
