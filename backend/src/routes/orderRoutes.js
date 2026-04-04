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

// Validate voucher for current cart
router.post("/voucher/validate", orderController.validateVoucher);

// Create new order (checkout)
router.post("/", orderController.createOrder);

// Get user's orders
// UC-44: API xem lịch sử đơn hàng của người dùng (đơn cũ + đơn hiện tại).
router.get("/", orderController.getUserOrders);

// Get order by order number
router.get("/number/:orderNumber", orderController.getOrderByNumber);

// Đặt lại đơn hàng từ đơn cũ
router.post("/:id/reorder", orderController.reorderOrder);

// Tải hoặc in hóa đơn của đơn đã giao
router.get("/:id/invoice", orderController.downloadInvoice);

// Gửi yêu cầu trả hàng / hoàn tiền
router.post("/:id/return-refund", orderController.submitReturnRefundRequest);

// Get single order by ID
// UC-45: API xem chi tiết một đơn hàng cụ thể.
router.get("/:id", orderController.getOrderById);

// Cancel order
router.patch("/:id/cancel", orderController.cancelOrder);

router.get(
  "/admin/revenue",
  authenticate,
  authorize(ROLES.ADMIN),
  orderController.getRevenue,
);
router.patch(
  "/admin/orders/:id/assign-shipper",
  authorize(ROLES.ADMIN),
  orderController.assignShipper,
);
// Shipper updates order status
router.post(
  "/:orderId/feedback",
  authenticate,
  orderController.submitFeedback
);
router.get(
  "/admin/feedbacks",
  authorize(ROLES.ADMIN),
  orderController.getAllShipperFeedbacks
);
router.get(
  "/admin/shipper-stats",
  authorize(ROLES.ADMIN),
  orderController.getShipperRatingStats
);
export default router;
