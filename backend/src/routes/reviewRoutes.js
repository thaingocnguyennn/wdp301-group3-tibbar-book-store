import express from "express";
import reviewController from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { reviewUpload } from "../middlewares/uploadMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.get("/book/:bookId", reviewController.getBookReviews);
router.get(
  "/admin/list",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  reviewController.getAllReviewsForAdmin,
);
router.get(
  "/book/:bookId/me",
  authenticate,
  reviewController.getMyReviewForBook,
);
router.post(
  "/book/:bookId",
  authenticate,
  reviewUpload.array("images", 5),
  reviewController.createReview,
);
router.put(
  "/:reviewId",
  authenticate,
  reviewUpload.array("images", 5),
  reviewController.updateOwnReview,
);
router.delete("/:reviewId", authenticate, reviewController.deleteOwnReview);
router.patch(
  "/:reviewId/reaction",
  authenticate,
  reviewController.reactToReview,
);
router.post(
  "/:reviewId/replies",
  authenticate,
  reviewController.addReplyToReview,
);

export default router;
