import express from "express";
import adminVoucherController from "../controllers/adminVoucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// UC-47: Admin xem toàn bộ voucher trong hệ thống.
router.get("/", adminVoucherController.getAllVouchers);
// UC-48: Admin tạo voucher mới.
router.post("/", adminVoucherController.createVoucher);
router.put("/:id", adminVoucherController.updateVoucher);
// UC-93: Admin gán voucher cho user cụ thể hoặc theo segment.
router.post("/:id/assign-users", adminVoucherController.assignVoucherToUsers);

export default router;
