import express from 'express';
import coinController from '../controllers/coinController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/check-in', coinController.checkIn); // Daily check-in to earn coins
router.get('/status', coinController.getCoinStatus); // Get current coin balance and check-in status
router.get('/transactions', coinController.getTransactionHistory); // Get coin transaction history with pagination and filtering

export default router;
