import cartService from "../services/cartService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.userId);
      return ApiResponse.success(res, HTTP_STATUS.OK, "Cart fetched", { cart });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const { bookId, quantity } = req.body;
      const cart = await cartService.addToCart(
        req.user.userId,
        bookId,
        Number(quantity) || 1,
      );
      return ApiResponse.success(res, HTTP_STATUS.OK, "Cart updated", { cart });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateItem(
        req.user.userId,
        req.params.bookId,
        Number(quantity),
      );
      return ApiResponse.success(res, HTTP_STATUS.OK, "Cart updated", { cart });
    } catch (error) {
      next(error);
    }
  }

  async removeCartItem(req, res, next) {
    try {
      const cart = await cartService.removeItem(
        req.user.userId,
        req.params.bookId,
      );
      return ApiResponse.success(res, HTTP_STATUS.OK, "Cart updated", { cart });
    } catch (error) {
      next(error);
    }
  }

  async validateCart(req, res, next) {
    try {
      const result = await cartService.validateStock(req.user.userId);
      return ApiResponse.success(res, HTTP_STATUS.OK, "Cart validated", result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CartController();
