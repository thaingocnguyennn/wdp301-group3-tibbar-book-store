import { Router } from "express";
import voucherController from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// GET /api/vouchers/available?subtotal=<number>
// Returns active, non-expired vouchers eligible for the given cart subtotal.
router.get("/available", authenticate, voucherController.getAvailableVouchers.bind(voucherController));

export default router;
