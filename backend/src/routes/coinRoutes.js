import express from 'express';
import coinController from '../controllers/coinController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/check-in', coinController.checkIn);
router.get('/status', coinController.getCoinStatus);
router.get('/transactions', coinController.getTransactionHistory);

// Admin routes
router.post('/admin/add', authorize(ROLES.ADMIN), coinController.adminAddCoins);
router.post('/admin/deduct', authorize(ROLES.ADMIN), coinController.adminDeductCoins);

export default router;
