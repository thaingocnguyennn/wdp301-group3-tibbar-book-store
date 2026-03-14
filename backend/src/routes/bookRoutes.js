import express from 'express';
import bookController from '../controllers/bookController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/', bookController.getPublicBooks);
router.get('/newest', bookController.getNewestBooks);
router.get('/best-selling', bookController.getBestSellingBooks);
router.get(
    '/recently-viewed',
    authenticate,
    bookController.getRecentlyViewed
);
// E-book routes (must be before /:id to avoid route collision)
router.get(
    '/:id/ebook-access',
    authenticate,
    bookController.checkEbookAccess
);
router.get(
    '/:id/ebook',
    authenticate,
    bookController.streamEbookFile
);
router.get(
    '/:id',
    authenticate,
    bookController.getBookById
);

export default router;