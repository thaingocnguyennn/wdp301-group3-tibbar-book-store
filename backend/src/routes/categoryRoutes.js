import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public endpoint - anyone can view categories for filtering
router.get('/', categoryController.getAllCategories);

// Admin-only endpoints
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;