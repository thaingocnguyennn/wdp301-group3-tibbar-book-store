import ApiError from "../utils/ApiError.js";
import SupportConversation from "../models/SupportConversation.js";
import SupportMessage from "../models/SupportMessage.js";

class SupportService {
  // sanitize input message từ request (có thể text hoặc image)
  // - Dùng chung cho customer và admin
  sanitizeMessageInput(input) {
    const content = typeof input?.content === "string"
      ? input.content.trim()
      : (typeof input === "string" ? input.trim() : "");
    const imageUrl = typeof input?.imageUrl === "string"
      ? input.imageUrl.trim()
      : "";

    if (!content && !imageUrl) {
      throw ApiError.badRequest("Message content or image is required");
    }

    return {
      content,
      imageUrl,
      preview: content || "[Image]",
    };
  }

  // Đảm bảo customer có conversation: nếu chưa có thì tạo mới
  async ensureCustomerConversation(customerId) {
    let conversation = await SupportConversation.findOne({ customer: customerId });

    if (!conversation) {
      conversation = await SupportConversation.create({ customer: customerId });
    }

    return conversation;
  }

  // Lấy conversation + messages cho customer. Khi vào trang support:
  // 1) Tạo mới conversation nếu chưa có
  // 2) Lấy toàn bộ messages theo conversation
  // 3) Gán unread admin => read (isReadByCustomer true)
  async getCustomerConversation(customerId) {
    const conversation = await this.ensureCustomerConversation(customerId);

    const messages = await SupportMessage.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email role")
      .lean();

    await Promise.all([
      SupportMessage.updateMany(
        {
          conversation: conversation._id,
          senderRole: "admin",
          isReadByCustomer: false,
        },
        { $set: { isReadByCustomer: true } },
      ),
      SupportConversation.findByIdAndUpdate(conversation._id, {
        $set: { unreadForCustomer: 0 },
      }),
    ]);

    return {
      conversation,
      messages,
    };
  }

  // Customer gửi tin nhắn (API /support/messages)
  // - Lưu message vào support_message
  // - Cập nhật thông tin conversation (lastMessageAt, lastMessagePreview, unreadForAdmin++)
  async sendCustomerMessage(customerId, content) {
    const messageInput = this.sanitizeMessageInput(content);
    const conversation = await this.ensureCustomerConversation(customerId);

    const message = await SupportMessage.create({
      conversation: conversation._id,
      sender: customerId,
      senderRole: "customer",
      content: messageInput.content,
      imageUrl: messageInput.imageUrl,
      isReadByAdmin: false,
      isReadByCustomer: true,
    });

    await SupportConversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: messageInput.preview.slice(0, 300),
      },
      $inc: { unreadForAdmin: 1 },
    });

    return message;
  }

  // Admin lấy tất cả conversations để hiện inbox (sắp xếp theo unread + last message)
  async getAdminConversations() {
    const conversations = await SupportConversation.find({})
      .sort({ unreadForAdmin: -1, lastMessageAt: -1 })
      .populate("customer", "firstName lastName email avatar role")
      .lean();

    return conversations;
  }

  async getConversationMessagesForAdmin(conversationId) {
    const conversation = await SupportConversation.findById(conversationId)
      .populate("customer", "firstName lastName email avatar role")
      .lean();

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    const messages = await SupportMessage.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email role")
      .lean();

    await Promise.all([
      SupportMessage.updateMany(
        {
          conversation: conversationId,
          senderRole: "customer",
          isReadByAdmin: false,
        },
        { $set: { isReadByAdmin: true } },
      ),
      SupportConversation.findByIdAndUpdate(conversationId, {
        $set: { unreadForAdmin: 0 },
      }),
    ]);

    return {
      conversation,
      messages,
    };
  }

  // Admin reply (UC-120)
  // - Lưu message admin
  // - Cập nhật conversation last message + unreadForCustomer++
  async sendAdminMessage(adminId, conversationId, content) {
    const messageInput = this.sanitizeMessageInput(content);

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    const message = await SupportMessage.create({
      conversation: conversationId,
      sender: adminId,
      senderRole: "admin",
      content: messageInput.content,
      imageUrl: messageInput.imageUrl,
      isReadByAdmin: true,
      isReadByCustomer: false,
    });

    await SupportConversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: messageInput.preview.slice(0, 300),
      },
      $inc: { unreadForCustomer: 1 },
    });

    return message;
  }

  async getAdminUnreadSummary() {
    const [unreadConversations, unreadMessagesResult] = await Promise.all([
      SupportConversation.countDocuments({ unreadForAdmin: { $gt: 0 } }),
      SupportConversation.aggregate([
        { $group: { _id: null, total: { $sum: "$unreadForAdmin" } } },
      ]),
    ]);

    return {
      unreadConversations,
      unreadMessages: unreadMessagesResult[0]?.total || 0,
    };
  }

  async markAdminMessagesAsRead(conversationId) {
    await Promise.all([
      SupportMessage.updateMany(
        {
          conversation: conversationId,
          senderRole: "admin",
          isReadByCustomer: false,
        },
        { $set: { isReadByCustomer: true } },
      ),
      SupportConversation.findByIdAndUpdate(conversationId, {
        $set: { unreadForCustomer: 0 },
      }),
    ]);
  }

  async markCustomerMessagesAsRead(conversationId) {
    await Promise.all([
      SupportMessage.updateMany(
        {
          conversation: conversationId,
          senderRole: "customer",
          isReadByAdmin: false,
        },
        { $set: { isReadByAdmin: true } },
      ),
      SupportConversation.findByIdAndUpdate(conversationId, {
        $set: { unreadForAdmin: 0 },
      }),
    ]);
  }
}

export default new SupportService();
