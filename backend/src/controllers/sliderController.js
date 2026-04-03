import sliderService from "../services/sliderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class SliderController {
  // UC-14: Controller xử lý request lấy sliders công khai
  // Endpoint: GET /api/sliders/public
  // Luồng xử lý:
  // 1. Gọi sliderService.getPublicSliders() để lấy danh sách sliders
  // 2. Trả về response thành công với data sliders
  // 3. Nếu có lỗi, chuyển cho error handler middleware
  async getPublicSliders(req, res, next) {
    try {
      // Lấy danh sách sliders công khai từ service
      const sliders = await sliderService.getPublicSliders();

      // Trả về response thành công với dữ liệu sliders
      return ApiResponse.success(res, HTTP_STATUS.OK, "Sliders fetched", {
        sliders,
      });
    } catch (error) {
      // Chuyển lỗi cho middleware error handler
      next(error);
    }
  }
}

export default new SliderController();
