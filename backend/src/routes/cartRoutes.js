import express from "express";
import cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// UC-27: Người dùng phải đăng nhập mới thao tác được với giỏ hàng.
router.use(authenticate);

router.get("/", cartController.getCart);
// UC-27: API thêm sách vào giỏ hàng.
router.post("/items", cartController.addToCart);
// UC-28: API cập nhật số lượng item trong giỏ.
router.patch("/items/:bookId", cartController.updateCartItem);
// UC-28: API xóa item khỏi giỏ.
router.delete("/items/:bookId", cartController.removeCartItem);
router.get("/validate", cartController.validateCart);

export default router;
