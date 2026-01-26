import express from "express";
import cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

/**
 * Cart Routes
 *
 * TẤT CẢ cart endpoints đều cần authentication
 * userId được lấy từ req.user (set bởi authMiddleware)
 *
 * ENDPOINTS:
 * - GET    /api/cart           -> Lấy giỏ hàng
 * - POST   /api/cart/items     -> Thêm item vào giỏ
 * - PUT    /api/cart/items/:id -> Update quantity
 * - DELETE /api/cart/items/:id -> Xóa item
 * - DELETE /api/cart           -> Xóa toàn bộ giỏ
 * - POST   /api/cart/validate  -> Validate cart trước checkout
 */

const router = express.Router();

// Apply authentication middleware cho TẤT CẢ cart routes
router.use(authenticate);

// ======================
// CART ROUTES
// ======================

/**
 * GET /api/cart
 * Lấy giỏ hàng của user hiện tại
 * Response: { cart: { items, totalPrice, totalItems, ... } }
 */
router.get("/", cartController.getCart);

/**
 * POST /api/cart/items
 * Thêm sách vào giỏ hàng
 * Body: { bookId: string, quantity: number }
 * Response: { cart: { ... } }
 */
router.post("/items", cartController.addToCart);

/**
 * PUT /api/cart/items/:bookId
 * Cập nhật số lượng của một item
 * Params: bookId
 * Body: { quantity: number }
 * Note: quantity = 0 -> xóa item
 * Response: { cart: { ... } }
 */
router.put("/items/:bookId", cartController.updateCartItem);

/**
 * DELETE /api/cart/items/:bookId
 * Xóa item khỏi giỏ hàng
 * Params: bookId
 * Response: { cart: { ... } }
 */
router.delete("/items/:bookId", cartController.removeFromCart);

/**
 * DELETE /api/cart
 * Xóa toàn bộ giỏ hàng
 * Dùng sau khi checkout hoặc khi user muốn clear cart
 * Response: { cart: { items: [], totalPrice: 0, totalItems: 0 } }
 */
router.delete("/", cartController.clearCart);

/**
 * POST /api/cart/validate
 * Validate giỏ hàng trước khi checkout
 * Kiểm tra:
 * - Book còn tồn tại và visible
 * - Stock đủ
 * - Price có thay đổi không
 * Response: { isValid: boolean, errors: [], warnings: [] }
 */
router.post("/validate", cartController.validateCart);

export default router;
