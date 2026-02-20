import reviewService from "../services/reviewService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class ReviewController {
  async getBookReviews(req, res, next) {
    try {
      const { bookId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await reviewService.getBookReviews(bookId, page, limit);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Reviews retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyReviewForBook(req, res, next) {
    try {
      const review = await reviewService.getMyReviewForBook(req.user._id, req.params.bookId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "My review retrieved successfully",
        { review },
      );
    } catch (error) {
      next(error);
    }
  }

  async createReview(req, res, next) {
    try {
      const review = await reviewService.createReview(req.user._id, req.params.bookId, req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Review created successfully",
        { review },
      );
    } catch (error) {
      next(error);
    }
  }

  async updateOwnReview(req, res, next) {
    try {
      const review = await reviewService.updateOwnReview(req.user._id, req.params.reviewId, req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Review updated successfully",
        { review },
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
