import shipperService from '../services/shipperService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import orderService from "../services/orderService.js";
class ShipperController {
  async getShipperOrders(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await shipperService.getShipperOrders(req.user._id, {
        page,
        limit,
        status
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Shipper orders retrieved successfully',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const order = await shipperService.getOrderDetails(
        req.params.orderId,
        req.user._id
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Order details retrieved successfully',
        order
      );
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;

      if (!status) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Order status is required'
        );
      }

      const order = await shipperService.updateOrderStatus(
        req.params.orderId,
        req.user._id,
        status
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Order status updated successfully',
        order
      );
    } catch (error) {
      next(error);
    }
  }

  async getShipperProfile(req, res, next) {
    try {
      const result = await shipperService.getShipperProfile(req.user._id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Shipper profile retrieved successfully',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getShipperDashboard(req, res, next) {
    try {
      const dashboard = await shipperService.getShipperDashboard(req.user.userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Shipper dashboard retrieved successfully',
        dashboard
      );
    } catch (error) {
      next(error);
    }
  }
  async respondAssignment(req, res, next) {
    try {
      const { action } = req.body;

      const result = await orderService.respondAssignment(
        req.params.orderId,
        req.user._id,
        action
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Respond assignment successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ShipperController();
