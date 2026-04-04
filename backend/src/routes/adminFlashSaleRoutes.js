import express from "express";
import adminFlashSaleController from "../controllers/adminFlashSaleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Middleware: Yêu cầu xác thực (đăng nhập) và quyền Admin
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Lấy chiến dịch flash sale hiện tại (Admin)
router.get("/current", adminFlashSaleController.getCurrentFlashSale);

// Tạo mới hoặc cập nhật chiến dịch flash sale (Admin)
router.put("/current", adminFlashSaleController.upsertFlashSale);

// Xóa/hủy chiến dịch flash sale hiện tại (Admin)
router.delete("/current", adminFlashSaleController.clearFlashSale);

export default router;
