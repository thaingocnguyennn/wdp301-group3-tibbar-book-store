import cartService from "../services/cartService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * CartController - Xử lý HTTP requests cho Cart
 *
 * RESPONSIBILITIES:
 * - Nhận request và extract userId từ req.user (đã authenticate)
 * - Validate input data
 * - Gọi CartService để xử lý logic
 * - Format và trả về response
 *
 * NOTE: Tất cả cart endpoints đều cần authentication
 * userId được lấy từ req.user (set bởi authMiddleware)
 */
class CartController {
  /**
   * [GET] /api/cart
   * Lấy giỏ hàng của user hiện tại
   * AUTHENTICATED USER
   */
  async getCart(req, res, next) {
    try {
      const userId = req.user.userId; // Từ authMiddleware
      const cart = await cartService.getCart(userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Cart retrieved successfully",
        { cart },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [POST] /api/cart/items
   * Thêm sách vào giỏ hàng
   * AUTHENTICATED USER
   *
   * Request body:
   * {
   *   bookId: string (required),
   *   quantity: number (default: 1)
   * }
   */
  async addToCart(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId, quantity = 1 } = req.body;

      // Basic validation
      if (!bookId) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Book ID is required",
        );
      }

      const cart = await cartService.addToCart(
        userId,
        bookId,
        Number(quantity),
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Item added to cart successfully",
        { cart },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PUT] /api/cart/items/:bookId
   * Cập nhật số lượng của một item trong cart
   * AUTHENTICATED USER
   *
   * Request body:
   * {
   *   quantity: number (required)
   * }
   */
  async updateCartItem(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;
      const { quantity } = req.body;

      // Validation
      if (quantity === undefined || quantity === null) {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Quantity is required",
        );
      }

      const cart = await cartService.updateCartItem(
        userId,
        bookId,
        Number(quantity),
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Cart item updated successfully",
        { cart },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [DELETE] /api/cart/items/:bookId
   * Xóa item khỏi giỏ hàng
   * AUTHENTICATED USER
   */
  async removeFromCart(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;

      const cart = await cartService.removeFromCart(userId, bookId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Item removed from cart successfully",
        { cart },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [DELETE] /api/cart
   * Xóa toàn bộ giỏ hàng
   * AUTHENTICATED USER
   */
  async clearCart(req, res, next) {
    try {
      const userId = req.user.userId;
      const cart = await cartService.clearCart(userId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Cart cleared successfully",
        { cart },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * [POST] /api/cart/validate
   * Validate giỏ hàng trước khi checkout
   * Kiểm tra stock, visibility, price changes
   * AUTHENTICATED USER
   */
  async validateCart(req, res, next) {
    try {
      const userId = req.user.userId;
      const validationResults = await cartService.validateCartStock(userId);

      if (validationResults.isValid) {
        return ApiResponse.success(
          res,
          HTTP_STATUS.OK,
          "Cart is valid for checkout",
          validationResults,
        );
      } else {
        return ApiResponse.error(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Cart validation failed",
          validationResults,
        );
      }
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new CartController();
