import express from 'express';
import adminUserController from '../controllers/adminUserController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', authenticate, authorize(ROLES.ADMIN), adminUserController.getAllUsers);
router.put('/:userId/role', authenticate, authorize(ROLES.ADMIN), adminUserController.updateUserRole);
router.patch('/:userId/toggle-status', authenticate, authorize(ROLES.ADMIN), adminUserController.toggleUserStatus);

export default router;
