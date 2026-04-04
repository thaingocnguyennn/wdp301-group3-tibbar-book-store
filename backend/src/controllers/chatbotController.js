import chatbotService from "../services/chatbotService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class ChatbotController {
  async ask(req, res, next) {
    try {
      // UC-128: nhận câu hỏi + ngữ cảnh để bot tự động gợi ý thông tin/yêu cầu cơ bản.
      // Input từ frontend: message (câu hỏi), messages (lịch sử), context (metadata).
      const { message, messages, context } = req.body;

      // Làm giàu context từ middleware auth:
      // - biết user có đăng nhập không
      // - biết vai trò user
      // - biết userId để hạn chế trả lời sai ngữ cảnh dữ liệu cá nhân
      const enrichedContext = {
        ...(context || {}),
        isAuthenticated: Boolean(req.user),
        userRole: req.user?.role || "guest",
        userId: req.user?._id || null,
      };

      const result = await chatbotService.ask({
        message,
        messages,
        context: enrichedContext,
      });

      // Trả response chuẩn ApiResponse cho frontend widget render.
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chatbot replied successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatbotController();
