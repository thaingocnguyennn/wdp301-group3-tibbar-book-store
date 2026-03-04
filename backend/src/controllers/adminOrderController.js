import orderService from "../services/orderService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminOrderController {
  async getAllOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const { status, paymentStatus, search, userId, fromDate, toDate } = req.query;

      const result = await orderService.getAllOrders({
        page,
        limit,
        status,
        paymentStatus,
        search,
        userId,
        fromDate,
        toDate,
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Orders retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderByIdAdmin(id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Order retrieved successfully",
        { order },
      );
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(id, status);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Order status updated successfully",
        { order },
      );
    } catch (error) {
      next(error);
    }
  }
  async autoAssignShipper(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.autoAssignShipper(id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Auto assigned shipper successfully",
        { order }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminOrderController();
