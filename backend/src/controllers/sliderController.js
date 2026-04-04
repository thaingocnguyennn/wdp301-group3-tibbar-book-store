import sliderService from "../services/sliderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class SliderController {
  // UC-23: Controller xử lý request lấy slider công khai cho homepage.
  // Endpoint: GET /api/sliders
  // Luồng xử lý:
  // 1. Gọi sliderService.getPublicSliders() để lấy danh sách sliders
  // 2. Trả về response thành công với data sliders
  // 3. Nếu có lỗi, chuyển cho error handler middleware
  async getPublicSliders(req, res, next) {
    try {
      // Lấy danh sách sliders public từ service để trả cho frontend homepage.
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
