import express from "express";
import reviewController from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/book/:bookId", reviewController.getBookReviews);
router.get("/book/:bookId/me", authenticate, reviewController.getMyReviewForBook);
router.post("/book/:bookId", authenticate, reviewController.createReview);
router.put("/:reviewId", authenticate, reviewController.updateOwnReview);

export default router;
