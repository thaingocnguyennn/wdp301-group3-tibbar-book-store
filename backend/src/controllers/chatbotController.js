import chatbotService from "../services/chatbotService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class ChatbotController {
  async ask(req, res, next) {
    try {
      const { message, messages, context } = req.body;

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
