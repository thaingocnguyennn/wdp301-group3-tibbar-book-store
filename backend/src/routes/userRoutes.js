import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/me', authenticate, authorize(ROLES.CUSTOMER, ROLES.ADMIN), userController.getProfile);
router.put('/me', authenticate, authorize(ROLES.CUSTOMER, ROLES.ADMIN), userController.updateProfile);

export default router;