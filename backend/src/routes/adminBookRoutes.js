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

router.get('/', adminBookController.getAllBooks); //lấy danh sách tất cả sách
router.post('/', bookFields, adminBookController.createBook); //tạo mới một cuốn sách
router.put('/:id', bookFields, adminBookController.updateBook); //cập nhật thông tin một cuốn sách
router.patch('/:id/visibility', adminBookController.updateVisibility); //cập nhật trạng thái hiển thị của một cuốn sách
//updatepreviewpages để cập nhật nhiều trang preview cùng lúc
router.post('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages); 
router.put('/:id/preview', previewUpload.array('previewPages', 10), adminBookController.updatePreviewPages);
router.patch('/:id/preview/manage', previewUpload.single('previewPage'), adminBookController.managePreviewPage);
router.delete('/:id', adminBookController.deleteBook); //xóa một cuốn sách

export default router;