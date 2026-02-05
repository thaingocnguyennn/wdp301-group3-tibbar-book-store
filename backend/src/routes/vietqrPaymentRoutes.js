import express from "express";
import vietqrPaymentController from "../controllers/vietqrPaymentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Generate VietQR payment QR code for an order
 * POST /api/payments/vietqr/create
 * Body: { orderId }
 * SECURITY: Amount is fetched from server, NOT from client
 */
router.post("/create", vietqrPaymentController.createVietQRPayment);

/**
 * Get VietQR payment details (idempotent - for refresh/revisit)
 * GET /api/payments/vietqr/:orderId
 */
router.get("/:orderId", vietqrPaymentController.getVietQRPayment);

export default router;
