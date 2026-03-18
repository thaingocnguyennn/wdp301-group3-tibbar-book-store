import ApiError from "../utils/ApiError.js";
import SupportConversation from "../models/SupportConversation.js";
import SupportMessage from "../models/SupportMessage.js";

class SupportService {
  sanitizeMessage(content) {
    const sanitized = (content || "").trim();
    if (!sanitized) {
      throw ApiError.badRequest("Message content is required");
    }
    return sanitized;
  }

  async ensureCustomerConversation(customerId) {
    let conversation = await SupportConversation.findOne({ customer: customerId });

    if (!conversation) {
      conversation = await SupportConversation.create({ customer: customerId });
    }

    return conversation;
  }

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

  async sendCustomerMessage(customerId, content) {
    const sanitizedContent = this.sanitizeMessage(content);
    const conversation = await this.ensureCustomerConversation(customerId);

    const message = await SupportMessage.create({
      conversation: conversation._id,
      sender: customerId,
      senderRole: "customer",
      content: sanitizedContent,
      isReadByAdmin: false,
      isReadByCustomer: true,
    });

    await SupportConversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: sanitizedContent.slice(0, 300),
      },
      $inc: { unreadForAdmin: 1 },
    });

    return message;
  }

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

  async sendAdminMessage(adminId, conversationId, content) {
    const sanitizedContent = this.sanitizeMessage(content);

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    const message = await SupportMessage.create({
      conversation: conversationId,
      sender: adminId,
      senderRole: "admin",
      content: sanitizedContent,
      isReadByAdmin: true,
      isReadByCustomer: false,
    });

    await SupportConversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: sanitizedContent.slice(0, 300),
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
}

export default new SupportService();
