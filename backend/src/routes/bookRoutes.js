import express from 'express';
import bookController from '../controllers/bookController.js';

const router = express.Router();

router.get('/', bookController.getPublicBooks);
router.get('/newest', bookController.getNewestBooks);
router.get('/best-selling', bookController.getBestSellingBooks);
router.get('/:id', bookController.getBookById);

export default router;