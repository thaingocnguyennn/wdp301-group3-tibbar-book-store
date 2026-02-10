import express from 'express';
import adminBookController from '../controllers/adminBookController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { bookUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', adminBookController.getAllBooks);
router.post('/', bookUpload.single('image'), adminBookController.createBook);
router.put('/:id', bookUpload.single('image'), adminBookController.updateBook);
router.patch('/:id/visibility', adminBookController.updateVisibility);
router.delete('/:id', adminBookController.deleteBook);

export default router;