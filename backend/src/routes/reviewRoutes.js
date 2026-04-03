import express from "express";
import reviewController from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { reviewUpload } from "../middlewares/uploadMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// UC-83: Lấy danh sách review của sách (công khai, hỗ trợ lọc theo sao)
router.get("/book/:bookId", reviewController.getBookReviews);

// Admin: Lấy tất cả review (hỗ trợ lọc + tìm kiếm + status trả lời)
router.get(
  "/admin/list",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  reviewController.getAllReviewsForAdmin,
);

// Lấy review của chính mình cho sách này
router.get(
  "/book/:bookId/me",
  authenticate,
  reviewController.getMyReviewForBook,
);

// UC-87: Tạo review với upload ảnh (tối đa 5 ảnh)
router.post(
  "/book/:bookId",
  authenticate,
  reviewUpload.array("images", 5),
  reviewController.createReview,
);

// Sửa review của chính mình
router.put(
  "/:reviewId",
  authenticate,
  reviewUpload.array("images", 5),
  reviewController.updateOwnReview,
);

// UC-82: Xóa review của chính mình
router.delete("/:reviewId", authenticate, reviewController.deleteOwnReview);

// UC-84: Thêm phản ứng (like/dislike) vào review
router.patch(
  "/:reviewId/reaction",
  authenticate,
  reviewController.reactToReview,
);

// UC-85: Thêm trả lời vào review (admin hay customer đều có thể trả lời)
router.post(
  "/:reviewId/replies",
  authenticate,
  reviewController.addReplyToReview,
);

export default router;
