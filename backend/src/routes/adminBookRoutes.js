import express from 'express';
import adminBookController from '../controllers/adminBookController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { bookUpload, previewUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', adminBookController.getAllBooks);
router.post('/', bookUpload.single('image'), adminBookController.createBook);
router.put('/:id', bookUpload.single('image'), adminBookController.updateBook);
router.patch('/:id/visibility', adminBookController.updateVisibility);
router.post('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages);
router.put('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages);
router.patch('/:id/preview/manage', previewUpload.single('previewPage'), adminBookController.managePreviewPage);
router.delete('/:id', adminBookController.deleteBook);

export default router;