import express from 'express';
import wishlistController from '../controllers/wishlistController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, wishlistController.getWishlist);
router.post('/:bookId', authenticate, wishlistController.addToWishlist);
router.delete('/:bookId', authenticate, wishlistController.removeFromWishlist);
router.get(
    '/admin/stats',
    authenticate,
    wishlistController.getWishlistStats
);

export default router;
