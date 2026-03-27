import cvService from "../services/cvService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class CVController {
  async createMyApplication(req, res, next) {
    try {
      const application = await cvService.createApplication(req.user._id, req.file);

      return ApiResponse.success(res, HTTP_STATUS.CREATED, "CV uploaded successfully", {
        application,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const applications = await cvService.getCustomerApplications(req.user._id);

      return ApiResponse.success(res, HTTP_STATUS.OK, "CV applications fetched", {
        applications,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CVController();
