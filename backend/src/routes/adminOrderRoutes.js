import express from "express";
import adminOrderController from "../controllers/adminOrderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", adminOrderController.getAllOrders);
router.get("/requests/recent", adminOrderController.getRecentCustomerRequests);
router.get("/:id", adminOrderController.getOrderById);
router.patch("/:id/status", adminOrderController.updateOrderStatus);
router.patch(
  "/:id/return-refund",
  adminOrderController.reviewReturnRefundRequest,
);

export default router;
