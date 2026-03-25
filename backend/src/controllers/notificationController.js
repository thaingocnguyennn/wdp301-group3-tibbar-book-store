import notificationService from "../services/notificationService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      console.log("REQ USER:", req.user);       // 👈 thêm dòng này
      console.log("USER ID:", req.user?._id);   // 👈 thêm dòng này
      const data = await notificationService.getNotifications(req.user._id);
      return ApiResponse.success(res, HTTP_STATUS.OK, "Notifications retrieved", data);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const data = await notificationService.markAsRead(req.params.id);
      return ApiResponse.success(res, HTTP_STATUS.OK, "Marked as read", data);
    } catch (err) {
      next(err);
    }
  }
}

export default new NotificationController();