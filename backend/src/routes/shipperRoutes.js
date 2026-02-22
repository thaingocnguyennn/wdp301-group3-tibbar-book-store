import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import shipperController from '../controllers/shipperController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

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

export default router;
