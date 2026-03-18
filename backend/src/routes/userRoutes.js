import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get(
  '/me',
  authenticate,
  authorize(ROLES.CUSTOMER, ROLES.ADMIN, ROLES.SHIPPER),
  userController.getProfile
);

router.put(
  '/me',
  authenticate,
  authorize(ROLES.CUSTOMER, ROLES.ADMIN, ROLES.SHIPPER),
  userController.updateProfile
);

router.put(
  '/me/change-password',
  authenticate,
  authorize(ROLES.CUSTOMER, ROLES.ADMIN, ROLES.SHIPPER),
  userController.changePassword
);
router.get(
  "/admin/shippers",
  authenticate,
  userController.getShippers
);
// Endpoint để lấy danh sách sách đã xem gần đây của người dùng
router.get(
  "/me/recently-viewed",
  authenticate,
  userController.getRecentlyViewed
);
export default router;