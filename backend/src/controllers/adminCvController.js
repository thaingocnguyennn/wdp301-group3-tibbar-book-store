import cvService from "../services/cvService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminCvController {
  async getAllApplications(req, res, next) {
    try {
      const applications = await cvService.getAdminApplications({
        status: req.query.status,
        keyword: req.query.keyword,
      });

      return ApiResponse.success(res, HTTP_STATUS.OK, "CV applications fetched", {
        applications,
        statuses: ["PENDING", "ACCEPTED", "REJECTED"],
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const application = await cvService.updateApplicationStatus(
        req.user._id,
        req.params.id,
        {
          status: req.body.status,
          adminNote: req.body.adminNote,
        },
      );

      return ApiResponse.success(res, HTTP_STATUS.OK, "CV application reviewed", {
        application,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminCvController();
