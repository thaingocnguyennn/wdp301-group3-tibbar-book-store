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
      const updatePayload = {
        
        visibility: req.body.visibility,
      };

      if (req.file) {
        updatePayload.imageUrl = `/uploads/sliders/${req.file.filename}`;
      }

      Object.keys(updatePayload).forEach((key) =>
        updatePayload[key] === undefined ? delete updatePayload[key] : null,
      );

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

  async deleteSlider(req, res, next) {
    try {
      await sliderService.deleteSlider(req.params.id);
      return ApiResponse.success(res, HTTP_STATUS.OK, "Slider deleted");
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminSliderController();
