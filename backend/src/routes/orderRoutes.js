import express from "express";
import orderController from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get available payment methods
router.get("/payment-methods", orderController.getPaymentMethods);

// Confirm payment (VNPAY callback) - must be before :id route
router.get("/payment/confirm", orderController.confirmPayment);

// Confirm VietQR payment manually (Admin only)
router.post("/vietqr/confirm/:orderNumber", orderController.confirmVietQRPayment);

// Create new order (checkout)
router.post("/", orderController.createOrder);

// Get user's orders
router.get("/", orderController.getUserOrders);

// Get order by order number
router.get("/number/:orderNumber", orderController.getOrderByNumber);

// Get single order by ID
router.get("/:id", orderController.getOrderById);

// Cancel order
router.patch("/:id/cancel", orderController.cancelOrder);

export default router;
