import express from 'express';
import adminBookController from '../controllers/adminBookController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { adminBookCombinedUpload } from '../middlewares/uploadMiddleware.js';
import { previewUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

const bookFields = adminBookCombinedUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'ebook', maxCount: 1 },
]);

router.get('/', adminBookController.getAllBooks);
router.post('/', bookFields, adminBookController.createBook);
router.put('/:id', bookFields, adminBookController.updateBook);
router.patch('/:id/visibility', adminBookController.updateVisibility);
router.post('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages);
router.put('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages);
router.patch('/:id/preview/manage', previewUpload.single('previewPage'), adminBookController.managePreviewPage);
router.delete('/:id', adminBookController.deleteBook);

export default router;