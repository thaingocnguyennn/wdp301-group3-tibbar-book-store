import express from 'express';
import {
  getLowStockBooks,
  subscribeBackStockAlert,
  getReadyBackStockAlerts,
  compareBooks
} from '../controllers/bookFeatureController.js';

const router = express.Router();

// Low stock alert (admin dùng)
router.get('/low-stock', getLowStockBooks);

// Back stock alert (customer đăng ký + lấy danh sách ready)
router.post('/back-stock/subscribe', subscribeBackStockAlert);
router.get('/back-stock/ready', getReadyBackStockAlerts);

// Compare books
router.get('/compare', compareBooks);

export default router;