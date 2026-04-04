import express from 'express';
import {
  getLowStockBooks,
  subscribeBackStockAlert,
  getReadyBackStockAlerts,
  compareBooks
} from '../controllers/bookFeatureController.js';

const router = express.Router();

// UC-124: Low Stock Alert
// API public để lấy danh sách sách low-stock theo threshold.
// Middleware: KHÔNG yêu cầu login/admin, KHÔNG upload file.
router.get('/low-stock', getLowStockBooks);

// UC-125: Back Stock Alert
// API đăng ký email nhận thông báo + kiểm tra danh sách đã có hàng lại.
// Middleware: KHÔNG yêu cầu login/admin, KHÔNG upload file.
router.post('/back-stock/subscribe', subscribeBackStockAlert);
router.get('/back-stock/ready', getReadyBackStockAlerts);

// UC-127: Compare Book
// API lấy dữ liệu nhiều sách để frontend render bảng so sánh.
// Middleware: KHÔNG yêu cầu login/admin, KHÔNG upload file.
router.get('/compare', compareBooks);

export default router;