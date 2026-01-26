import express from 'express';
import adminBookController from '../controllers/adminBookController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', adminBookController.getAllBooks);
router.post('/', adminBookController.createBook);
router.put('/:id', adminBookController.updateBook);
router.patch('/:id/visibility', adminBookController.updateVisibility);
router.delete('/:id', adminBookController.deleteBook);

export default router;