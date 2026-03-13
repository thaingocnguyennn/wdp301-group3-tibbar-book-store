import reviewService from "../services/reviewService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

const parseStringArray = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

class ReviewController {
  async getBookReviews(req, res, next) {
    try {
      const { bookId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const rating = req.query.rating;

      const result = await reviewService.getBookReviews(bookId, page, limit, {
        rating,
      });

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

  async getAllReviewsForAdmin(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const rating = req.query.rating;
      const replyStatus = req.query.replyStatus || "all";

      const result = await reviewService.getAllReviewsForAdmin({
        page,
        limit,
        search,
        rating,
        replyStatus,
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Admin reviews retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyReviewForBook(req, res, next) {
    try {
      const review = await reviewService.getMyReviewForBook(
        req.user._id,
        req.params.bookId,
      );

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
      const uploadedImages = (req.files || []).map(
        (file) => `uploads/reviews/${file.filename}`,
      );
      const review = await reviewService.createReview(
        req.user._id,
        req.params.bookId,
        {
          ...req.body,
          images: uploadedImages,
        },
      );

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
      const uploadedImages = (req.files || []).map(
        (file) => `uploads/reviews/${file.filename}`,
      );
      const keepExistingImages = parseStringArray(req.body.keepExistingImages);

      const review = await reviewService.updateOwnReview(
        req.user._id,
        req.params.reviewId,
        {
          ...req.body,
          keepExistingImages,
          images: uploadedImages,
        },
      );

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

  async deleteOwnReview(req, res, next) {
    try {
      await reviewService.deleteOwnReview(req.user._id, req.params.reviewId);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Review deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async reactToReview(req, res, next) {
    try {
      const result = await reviewService.reactToReview(
        req.user._id,
        req.params.reviewId,
        req.body.type,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Review reaction updated successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async addReplyToReview(req, res, next) {
    try {
      const review = await reviewService.addReplyToReview(
        req.user._id,
        req.user.role,
        req.params.reviewId,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Reply added successfully",
        { review },
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
