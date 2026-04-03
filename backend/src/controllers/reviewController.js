import reviewService from "../services/reviewService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

// Helper: parse string array từ form data trở thành mảng
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
  // UC-59: Lấy danh sách review của sách (View review of the book)
  // GET /reviews/book/:bookId?rating=3&page=1&limit=10
  // Hiển thị tất cả review, rating, summary cho sách
  async getBookReviews(req, res, next) {
    try {
      const { bookId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      // rating: lọc theo số sao (optional) - liên quan UC-83 nhưng cũng dùng cho UC-59
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

  // Lấy tất cả review cho admin dashboard (có tìm kiếm, lọc status trả lời)
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

  // Lấy review của chính mình cho một sách
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

  // UC-56: Tạo review mới cho sách (Add book review)
  // UC-57: Bao gồm rating sao (Rate book)
  // POST /reviews/book/:bookId {rating, comment, file: images}
  // Kiểm tra user đã mua sách, chưa review trước đó
  async createReview(req, res, next) {
    try {
      // Lấy đường dẫn ảnh từ middleware upload
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

  // UC-58: Cập nhật review của chính mình (Edit own review)
  // PUT /reviews/:reviewId {rating, comment, keepExistingImages[], file: images}
  // Chỉ chủ sở hữu mới có thể sửa, có thể cập nhật rating/comment/images
  async updateOwnReview(req, res, next) {
    try {
      const uploadedImages = (req.files || []).map(
        (file) => `uploads/reviews/${file.filename}`,
      );
      // Parse ảnh cũ mà user muốn giữ lại
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

  // UC-82: Xóa review của chính mình
  // DELETE /reviews/:reviewId
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

  // UC-84: Thêm/cập nhật phản ứng (like/dislike) cho review
  // PATCH /reviews/:reviewId/reaction {type: "HELPFUL" | "DISLIKE"}
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

  // UC-85: Thêm trả lời vào review (admin hay customer đều có thể trả lời)
  // POST /reviews/:reviewId/replies {comment: "..."}
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
