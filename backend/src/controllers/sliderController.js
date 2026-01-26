import sliderService from "../services/sliderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * SliderController - Xử lý HTTP requests cho Slider
 *
 * RESPONSIBILITIES:
 * - Nhận request từ client
 * - Validate request data (basic validation)
 * - Gọi SliderService để xử lý business logic
 * - Format response và gửi về client
 * - Pass errors đến error handler middleware
 *
 * CLEAN CODE:
 * - Mỗi method tương ứng với 1 endpoint
 * - Try-catch để bắt lỗi và pass cho error handler
 * - Sử dụng ApiResponse helper để format response nhất quán
 */
class SliderController {
  /**
   * [GET] /api/sliders/public
   * Lấy danh sách slider đang hiển thị (cho homepage)
   * PUBLIC API - không cần authentication
   */
  async getVisibleSliders(req, res, next) {
    try {
      const sliders = await sliderService.getVisibleSliders();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Sliders retrieved successfully",
        { sliders },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET] /api/admin/sliders
   * Lấy tất cả sliders (bao gồm hidden) - cho admin
   * ADMIN ONLY
   */
  async getAllSliders(req, res, next) {
    try {
      const filters = {
        visibility: req.query.visibility,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const sliders = await sliderService.getAllSliders(filters);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Sliders retrieved successfully",
        { sliders },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET] /api/admin/sliders/:id
   * Lấy chi tiết một slider
   * ADMIN ONLY
   */
  async getSliderById(req, res, next) {
    try {
      const { id } = req.params;
      const slider = await sliderService.getSliderById(id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Slider retrieved successfully",
        { slider },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [POST] /api/admin/sliders
   * Tạo slider mới
   * ADMIN ONLY
   *
   * Request body:
   * {
   *   title: string (required),
   *   description: string,
   *   imageUrl: string (required),
   *   bookId: string (optional),
   *   linkUrl: string (optional),
   *   order: number (default: 0),
   *   visibility: 'visible' | 'hidden' (default: 'visible')
   * }
   */
  async createSlider(req, res, next) {
    try {
      const sliderData = req.body;
      const slider = await sliderService.createSlider(sliderData);

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Slider created successfully",
        { slider },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PUT] /api/admin/sliders/:id
   * Cập nhật slider
   * ADMIN ONLY
   */
  async updateSlider(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const slider = await sliderService.updateSlider(id, updateData);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Slider updated successfully",
        { slider },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PATCH] /api/admin/sliders/:id/visibility
   * Thay đổi visibility của slider
   * ADMIN ONLY
   *
   * Request body:
   * {
   *   visibility: 'visible' | 'hidden'
   * }
   */
  async toggleVisibility(req, res, next) {
    try {
      const { id } = req.params;
      const { visibility } = req.body;

      if (!visibility) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Visibility is required",
        );
      }

      const slider = await sliderService.toggleVisibility(id, visibility);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Slider visibility updated successfully",
        { slider },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [DELETE] /api/admin/sliders/:id
   * Xóa slider
   * ADMIN ONLY
   */
  async deleteSlider(req, res, next) {
    try {
      const { id } = req.params;
      await sliderService.deleteSlider(id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Slider deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new SliderController();
