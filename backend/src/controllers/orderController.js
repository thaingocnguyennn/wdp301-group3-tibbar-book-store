import orderService from "../services/orderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class OrderController {
  // Create new order (checkout)
  async createOrder(req, res, next) {
    try {
      const userId = req.user._id;
      const { paymentMethod, shippingAddressId, voucherId, voucherCode, notes } = req.body;
      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";

      console.log("🛒 [OrderController] Create order request:", {
        userId,
        userEmail: req.user.email,
        paymentMethod,
        timestamp: new Date().toISOString()
      });

      const result = await orderService.createOrder(userId, {
        paymentMethod,
        shippingAddressId,
        voucherId,
        voucherCode,
        notes,
        ipAddress,
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Order created successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async validateVoucher(req, res, next) {
    try {
      const userId = req.user._id;
      const { voucherCode } = req.body;

      const result = await orderService.validateVoucherForCheckout(userId, voucherCode);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Voucher validated successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user's orders
  async getUserOrders(req, res, next) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await orderService.getUserOrders(userId, page, limit);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Orders retrieved successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // Get single order by ID
  async getOrderById(req, res, next) {
    try {
      const userId = req.user._id;
      const orderId = req.params.id;

      const order = await orderService.getOrderById(orderId, userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Order retrieved successfully",
        { order }
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order by order number
  async getOrderByNumber(req, res, next) {
    try {
      const userId = req.user._id;
      const orderNumber = req.params.orderNumber;

      const order = await orderService.getOrderByNumber(orderNumber, userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Order retrieved successfully",
        { order }
      );
    } catch (error) {
      next(error);
    }
  }

  // Confirm payment (for VNPAY callback)
  async confirmPayment(req, res, next) {
    try {
      const { orderNumber, ...callbackParams } = req.query;

      const result = await orderService.confirmPayment(orderNumber, callbackParams);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Payment confirmed successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req, res, next) {
    try {
      const userId = req.user._id;
      const orderId = req.params.id;

      const order = await orderService.cancelOrder(orderId, userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Order cancelled successfully",
        { order }
      );
    } catch (error) {
      next(error);
    }
  }

  // Get available payment methods
  async getPaymentMethods(req, res, next) {
    try {
      const methods = await orderService.getAvailablePaymentMethods();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Payment methods retrieved successfully",
        { methods }
      );
    } catch (error) {
      next(error);
    }
  }

  // Confirm VietQR payment manually (Admin only)
  async confirmVietQRPayment(req, res, next) {
    try {
      const { orderNumber } = req.params;

      const result = await orderService.confirmVietQRPayment(orderNumber);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "VietQR payment confirmed successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }
  getRevenue = async (req, res, next) => {
    try {
      const { range } = req.query;
      const data = await orderService.getRevenue(range);

      res.json(data);
    } catch (err) {
      next(err);
    }
  };
  assignShipper = async (req, res, next) => {
    try {
      const { shipperId } = req.body;
      const orderId = req.params.id;

      const order = await orderService.assignShipper(orderId, shipperId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Shipper assigned successfully",
        { order }
      );
    } catch (err) {
      next(err);
    }
  };


}

export default new OrderController();
