import supportService from "../services/supportService.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, ROLES } from "../config/constants.js";

const validateCustomer = (req) => {
  if (req.user?.role !== ROLES.CUSTOMER) {
    throw ApiError.forbidden("Only customers can access support chat");
  }
};

class SupportController {
  async getMyConversation(req, res, next) {
    try {
      validateCustomer(req);

      const result = await supportService.getCustomerConversation(req.user._id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Support conversation fetched",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async sendMyMessage(req, res, next) {
    try {
      validateCustomer(req);

      const message = await supportService.sendCustomerMessage(
        req.user._id,
        req.body.content,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Message sent",
        { message },
      );
    } catch (error) {
      next(error);
    }
  }

  async sendMyImageMessage(req, res, next) {
    try {
      validateCustomer(req);

      if (!req.file) {
        throw ApiError.badRequest("Image file is required");
      }

      const imageUrl = `/uploads/support/${req.file.filename}`;
      const message = await supportService.sendCustomerMessage(req.user._id, {
        content: req.body.content,
        imageUrl,
      });

      const populatedMessage = await message.populate(
        "sender",
        "firstName lastName email role",
      );

      const io = req.app.get("io");
      const roomConversationId = populatedMessage.conversation.toString();
      if (io) {
        io.to(`conversation:${roomConversationId}`).emit("message:new", {
          conversationId: roomConversationId,
          message: populatedMessage,
          senderRole: "customer",
        });

        io.to("admin:support").emit("message:new", {
          conversationId: roomConversationId,
          message: populatedMessage,
          senderRole: "customer",
        });
      }

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Image message sent",
        { message: populatedMessage },
      );
    } catch (error) {
      next(error);
    }
  }

  async getAdminConversations(req, res, next) {
    try {
      const conversations = await supportService.getAdminConversations();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Support conversations fetched",
        { conversations },
      );
    } catch (error) {
      next(error);
    }
  }

  async getAdminConversationMessages(req, res, next) {
    try {
      const result = await supportService.getConversationMessagesForAdmin(
        req.params.conversationId,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Conversation messages fetched",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async sendAdminMessage(req, res, next) {
    try {
      const message = await supportService.sendAdminMessage(
        req.user._id,
        req.params.conversationId,
        req.body.content,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Admin message sent",
        { message },
      );
    } catch (error) {
      next(error);
    }
  }

  async sendAdminImageMessage(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest("Image file is required");
      }

      const conversationId = req.params.conversationId;
      const imageUrl = `/uploads/support/${req.file.filename}`;
      const message = await supportService.sendAdminMessage(
        req.user._id,
        conversationId,
        {
          content: req.body.content,
          imageUrl,
        },
      );

      const populatedMessage = await message.populate(
        "sender",
        "firstName lastName email role",
      );

      const io = req.app.get("io");
      if (io) {
        io.to(`conversation:${conversationId}`).emit("message:new", {
          conversationId,
          message: populatedMessage,
          senderRole: "admin",
        });

        io.to("admin:support").emit("message:new", {
          conversationId,
          message: populatedMessage,
          senderRole: "admin",
        });
      }

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Admin image message sent",
        { message: populatedMessage },
      );
    } catch (error) {
      next(error);
    }
  }

  async getAdminUnreadSummary(req, res, next) {
    try {
      const summary = await supportService.getAdminUnreadSummary();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Unread summary fetched",
        summary,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new SupportController();
