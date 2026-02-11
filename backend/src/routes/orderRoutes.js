import express from "express";
import orderController from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

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

router.get(
    "/admin/revenue",
    authenticate,
    authorize(ROLES.ADMIN),
    orderController.getRevenue
);
router.patch(
    "/admin/orders/:id/assign-shipper",
    authorize(ROLES.ADMIN),
    orderController.assignShipper
);


export default router;
