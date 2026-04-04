import sliderService from "../services/sliderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminSliderController {
  async getAllSliders(req, res, next) {
    try {
      const sliders = await sliderService.getAllSliders();
      return ApiResponse.success(res, HTTP_STATUS.OK, "Sliders fetched", {
        sliders,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSlider(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Image is required",
        );
      }

      const payload = {
        adminId: req.user?._id || req.user?.userId || undefined,
        imageUrl: `/uploads/sliders/${req.file.filename}`,
       
        visibility: req.body.visibility || "public",
      };

      const slider = await sliderService.createSlider(payload);

      return ApiResponse.success(res, HTTP_STATUS.CREATED, "Slider created", {
        slider,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSlider(req, res, next) {
    try {
      // UC-25: Controller nhận dữ liệu sửa slider từ admin (có thể kèm ảnh mới).
      // Chỉ gom các field được phép cập nhật từ request body.
      const updatePayload = {
        
        visibility: req.body.visibility,
      };

      if (req.file) {
        // Nếu có ảnh mới thì ghi đè imageUrl sang file vừa upload.
        updatePayload.imageUrl = `/uploads/sliders/${req.file.filename}`;
      }

      // Loại bỏ các key undefined để tránh ghi đè dữ liệu cũ bằng undefined.
      Object.keys(updatePayload).forEach((key) =>
        updatePayload[key] === undefined ? delete updatePayload[key] : null,
      );

      // Gọi service để thực hiện cập nhật thật sự ở tầng business/data.
      const slider = await sliderService.updateSlider(
        req.params.id,
        updatePayload,
      );

      return ApiResponse.success(res, HTTP_STATUS.OK, "Slider updated", {
        slider,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVisibility(req, res, next) {
    try {
      // UC-26: Controller chỉ cập nhật trường visibility để ẩn/hiện slider.
      // Lấy trạng thái mới (public/hidden) từ body.
      const { visibility } = req.body;
      const slider = await sliderService.updateVisibility(
        req.params.id,
        visibility,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Slider visibility updated",
        {
          slider,
        },
      );
    } catch (error) {
      next(error);
    }
  }

  // UC-16: Controller xử lý request xóa slider (Admin)
  // Endpoint: DELETE /api/admin/sliders/:id
  // Luồng xử lý:
  // 1. Nhận slider ID từ URL params
  // 2. Gọi sliderService.deleteSlider() để xóa slider
  // 3. Trả về response thành công với message "Slider deleted"
  // 4. Nếu có lỗi, chuyển cho error handler middleware
  async deleteSlider(req, res, next) {
    try {
      // Xóa slider theo ID
      await sliderService.deleteSlider(req.params.id);

      // Trả về response thành công
      return ApiResponse.success(res, HTTP_STATUS.OK, "Slider deleted");
    } catch (error) {
      // Chuyển lỗi cho middleware error handler
      next(error);
    }
  }
}

export default new AdminSliderController();
