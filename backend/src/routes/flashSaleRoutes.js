import express from "express";
import flashSaleController from "../controllers/flashSaleController.js";

const router = express.Router();

// Lấy chiến dịch flash sale hiện tại (API công khai, người dùng có thể truy cập)
// Dùng để hiển thị flash sale trên homepage, book detail, cart, checkout
router.get("/active", flashSaleController.getActiveFlashSale);

export default router;
