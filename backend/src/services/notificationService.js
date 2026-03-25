import Notification from "../models/Notification.js";

class NotificationService {
  async notifyNewOrder(shipperId, orderId) {
    console.log("🔥 NOTIFICATION CREATED", shipperId, orderId);
    return await Notification.create({
      user: shipperId,
      title: "📦 New Order Assigned",
      message: `You have a new order #${orderId}`,
      type: "ORDER_ASSIGNED",
    });
  }

  async getNotifications(userId) {
    return await Notification.find({ user: userId })
      .sort({ createdAt: -1 });
  }

  async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }
}

export default new NotificationService();