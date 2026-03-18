import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import shipperController from '../controllers/shipperController.js';
import { deliveryProofUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// All routes require authentication and shipper role
router.use(authenticate);
router.use(authorize(ROLES.SHIPPER));

// Get shipper dashboard with statistics
router.get('/dashboard', (req, res, next) =>
  shipperController.getShipperDashboard(req, res, next)
);

// Get shipper profile with statistics
router.get('/profile', (req, res, next) =>
  shipperController.getShipperProfile(req, res, next)
);

// Get all orders assigned to shipper
router.get('/orders', (req, res, next) =>
  shipperController.getShipperOrders(req, res, next)
);

// Get order details with address
router.get('/orders/:orderId', (req, res, next) =>
  shipperController.getOrderDetails(req, res, next)
);

// Update order status
router.put('/orders/:orderId/status', (req, res, next) =>
  shipperController.updateOrderStatus(req, res, next)
);
router.post(
  "/orders/:orderId/respond",
  shipperController.respondAssignment
);
router.post(
  "/orders/:orderId/upload-proof",
  deliveryProofUpload.single("image"),
  shipperController.uploadProof
);

router.get("/assignment-history", shipperController.getAssignmentHistory);

router.get(
  "/performance",
  authorize("shipper"),
  shipperController.getPerformance
);
export default router;
