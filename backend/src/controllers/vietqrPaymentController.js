import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import paymentService from "../services/paymentService.js";

class VietQRPaymentController {
  /**
   * Generate VietQR payment QR code for an existing order
   * SECURITY: Amount is fetched from server order, NOT from client
   * Endpoint: POST /api/payments/vietqr/create
   */
  async createVietQRPayment(req, res, next) {
    try {
      const { orderId } = req.body;
      const userId = req.user._id;

      console.log("🔐 [VietQR] Generate QR request:", {
        orderId,
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      });

      // Validation
      if (!orderId) {
        throw ApiError.badRequest("Order ID is required");
      }

      // Fetch order from database (server-authoritative)
      const order = await Order.findById(orderId);

      if (!order) {
        throw ApiError.notFound("Order not found");
      }

      // Authorization check - order must belong to current user
      if (order.user.toString() !== userId.toString()) {
        console.warn("⚠️ [VietQR] Unauthorized QR generation attempt:", {
          orderId,
          orderUser: order.user.toString(),
          requestUser: userId.toString()
        });
        throw ApiError.forbidden("You are not authorized to access this order");
      }

      // Business rule checks
      if (order.paymentMethod !== "VIETQR") {
        throw ApiError.badRequest("This order does not use VietQR payment method");
      }

      if (order.paymentStatus === "PAID") {
        throw ApiError.badRequest("This order has already been paid");
      }

      if (order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED") {
        throw ApiError.badRequest("Cannot generate QR for cancelled or failed order");
      }

      // CRITICAL: Amount comes from server order, ignore any client-provided amount
      if (req.body.amount) {
        console.warn("⚠️ [VietQR] Client tried to provide amount, ignoring:", {
          clientAmount: req.body.amount,
          serverAmount: order.total,
          orderId
        });
      }

      // Generate QR using server-authoritative amount
      const vietqrProvider = paymentService.getProvider("VIETQR");
      const paymentData = await vietqrProvider.createPayment({
        orderNumber: order.orderNumber,
        total: order.total, // SERVER-AUTHORITATIVE AMOUNT
        ipAddress: req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1"
      });

      console.log("✅ [VietQR] QR generated successfully:", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.total,
        hasQrUrl: !!paymentData.qrCodeUrl
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "VietQR payment QR code generated successfully",
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          qrCodeUrl: paymentData.qrCodeUrl,
          bankInfo: paymentData.bankInfo,
          amount: paymentData.amount,
          description: paymentData.description,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get VietQR payment details for an existing order (idempotent)
   * Allows user to refresh/revisit payment screen
   * Endpoint: GET /api/payments/vietqr/:orderId
   */
  async getVietQRPayment(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      const order = await Order.findById(orderId);

      if (!order) {
        throw ApiError.notFound("Order not found");
      }

      // Authorization check
      if (order.user.toString() !== userId.toString()) {
        throw ApiError.forbidden("You are not authorized to access this order");
      }

      if (order.paymentMethod !== "VIETQR") {
        throw ApiError.badRequest("This order does not use VietQR payment method");
      }

      // Regenerate QR (idempotent - same order, same amount)
      const vietqrProvider = paymentService.getProvider("VIETQR");
      const paymentData = await vietqrProvider.createPayment({
        orderNumber: order.orderNumber,
        total: order.total,
        ipAddress: req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1"
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "VietQR payment details retrieved",
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          qrCodeUrl: paymentData.qrCodeUrl,
          bankInfo: paymentData.bankInfo,
          amount: paymentData.amount,
          description: paymentData.description,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new VietQRPaymentController();
