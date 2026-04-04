import { Router } from "express";
import voucherController from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// GET /api/vouchers/available?subtotal=<number>
// Returns active, non-expired vouchers eligible for the given cart subtotal.
// UC-92: Endpoint lấy voucher còn hiệu lực (auto-expire được đồng bộ ở service).
router.get(
  "/available",
  authenticate,
  voucherController.getAvailableVouchers.bind(voucherController),
);
// UC-91 + UC-93: Endpoint lấy ví voucher của user (trạng thái sử dụng + voucher được gán riêng).
router.get(
  "/mine",
  authenticate,
  voucherController.getMyVouchers.bind(voucherController),
);

export default router;
