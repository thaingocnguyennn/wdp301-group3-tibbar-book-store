import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

class ReviewService {
  // UC-87: Chuẩn hóa đường dẫn ảnh (xóa backslash, cắt quá 5 ảnh)
  normalizeImagePaths(images = []) {
    if (!Array.isArray(images)) return [];
    return images
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((item) => item.replace(/\\/g, "/"))
      .map((item) => {
        if (item.startsWith("http://") || item.startsWith("https://")) {
          return item;
        }

        const uploadsIndex = item.toLowerCase().indexOf("uploads/");
        if (uploadsIndex >= 0) {
          return item.slice(uploadsIndex);
        }

        return item.replace(/^\/+/, "");
      });
  }

  // UC-83: Parse và xác thực filter rating (1-5)
  parseRatingFilter(rating) {
    if (rating === undefined || rating === null || rating === "") {
      return null;
    }

    const normalizedRating = Number(rating);
    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      throw ApiError.badRequest(
        "Rating filter must be an integer between 1 and 5",
      );
    }

    return normalizedRating;
  }

  // UC-84: Tính tóm tắt phản ứng (bao nhiêu helpful, bao nhiêu dislike)
  getReactionSummary(reactions = []) {
    return reactions.reduce(
      (summary, reaction) => {
        if (reaction.type === "HELPFUL") {
          summary.helpful += 1;
        }
        if (reaction.type === "DISLIKE") {
          summary.dislike += 1;
        }
        return summary;
      },
      { helpful: 0, dislike: 0 },
    );
  }

  // UC-85: Chuẩn hóa mảng trả lời (trim whitespace)
  normalizeReplies(replies = []) {
    if (!Array.isArray(replies)) return [];
    return replies.map((reply) => ({
      ...reply,
      comment: String(reply.comment || "").trim(),
    }));
  }

  // UC-83: Lấy review của sách, support lọc theo sao
  // Trả về: danh sách review, phân trang, tóm tắt rating (TB, tổng, breakdown)
  async getBookReviews(bookId, page = 1, limit = 10, options = {}) {
    const ratingFilter = this.parseRatingFilter(options.rating);
    const skip = (page - 1) * limit;
    const match = {
      book: new mongoose.Types.ObjectId(bookId),
    };

    // Nếu có filter rating, thêm vào query
    if (ratingFilter) {
      match.rating = ratingFilter;
    }

    // Chạy 3 query song song: danh sách review, tổng số, thống kê rating
    const [reviews, total, summaryResult] = await Promise.all([
      Review.find(match)
        .populate("user", "firstName lastName email")
        .populate("replies.user", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(match),
      Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$book",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Lấy breakdown: bao nhiêu review cho mỗi sao (1-5)
    const breakdownResult = await Review.aggregate([
      { $match: { book: new mongoose.Types.ObjectId(bookId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownResult.forEach((item) => {
      ratingBreakdown[String(item._id)] = item.count;
    });

    const summary = summaryResult[0] || { averageRating: 0, totalReviews: 0 };

    // Chuẩn hóa dữ liệu review trước khi trả về
    const normalizedReviews = reviews.map((review) => ({
      ...review,
      images: this.normalizeImagePaths(review.images || []),
      reactionSummary: this.getReactionSummary(review.reactions || []),
      replies: this.normalizeReplies(review.replies || []),
    }));

    return {
      reviews: normalizedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        averageRating: Math.round((summary.averageRating || 0) * 10) / 10,
        totalReviews: summary.totalReviews || 0,
        ratingBreakdown,
      },
    };
  }

  // Admin: Lấy tất cả review với tìm kiếm, lọc rating, lọc status trả lời
  async getAllReviewsForAdmin({
    page = 1,
    limit = 20,
    search = "",
    rating,
    replyStatus = "all",
  } = {}) {
    const skip = (page - 1) * limit;
    const match = {};
    const ratingFilter = this.parseRatingFilter(rating);

    if (ratingFilter) {
      match.rating = ratingFilter;
    }

    // Lọc theo status trả lời: all, replied (có trả lời), pending (chưa trả lời)
    if (replyStatus === "replied") {
      match["replies.0"] = { $exists: true };
    }

    if (replyStatus === "pending") {
      match["replies.0"] = { $exists: false };
    }

    // Tìm kiếm trong comment, book title, email/name user
    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch, "i");
      const [bookCandidates, userCandidates] = await Promise.all([
        Book.find({ title: regex }).select("_id").lean(),
        User.find({
          $or: [{ email: regex }, { firstName: regex }, { lastName: regex }],
        })
          .select("_id")
          .lean(),
      ]);

      const bookIds = bookCandidates.map((item) => item._id);
      const userIds = userCandidates.map((item) => item._id);

      match.$or = [{ comment: regex }];
      if (bookIds.length > 0) {
        match.$or.push({ book: { $in: bookIds } });
      }
      if (userIds.length > 0) {
        match.$or.push({ user: { $in: userIds } });
      }
    }

    const [reviews, total] = await Promise.all([
      Review.find(match)
        .populate("user", "firstName lastName email role")
        .populate("book", "title")
        .populate("replies.user", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(match),
    ]);

    const normalizedReviews = reviews.map((review) => ({
      ...review,
      images: this.normalizeImagePaths(review.images || []),
      reactionSummary: this.getReactionSummary(review.reactions || []),
      replies: this.normalizeReplies(review.replies || []),
    }));

    return {
      reviews: normalizedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy review của user hiện tại cho một sách
  async getMyReviewForBook(userId, bookId) {
    const review = await Review.findOne({ user: userId, book: bookId })
      .populate("replies.user", "firstName lastName email role")
      .lean();
    if (!review) {
      return null;
    }

    return {
      ...review,
      images: this.normalizeImagePaths(review.images || []),
      reactionSummary: this.getReactionSummary(review.reactions || []),
      replies: this.normalizeReplies(review.replies || []),
    };
  }

  // UC-85: Thêm trả lời vào review
  async addReplyToReview(userId, userRole, reviewId, payload) {
    const comment = String(payload?.comment || "").trim();
    if (!comment) {
      throw ApiError.badRequest("Reply content is required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    // Thêm reply vào mảng replies của review
    review.replies.push({
      user: userId,
      role: String(userRole || "customer").toLowerCase(),
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await review.save();

    return review;
  }

  // UC-56: Tạo review mới cho sách (Add book review)
  // UC-57: Bao gồm rating sao (Rate book)
  // Kiểm tra: sách tồn tại, user đã mua sách, chưa review trước đó
  async createReview(userId, bookId, payload) {
    const { rating, comment = "", images = [] } = payload;

    await this.ensureBookExists(bookId);
    // Kiểm tra user đã mua sách này chưa trước khi cho review
    await this.ensureUserPurchasedBook(userId, bookId);

    // Ngừng user viết 2 review cho cùng 1 sách
    const existingReview = await Review.findOne({ user: userId, book: bookId });
    if (existingReview) {
      throw ApiError.conflict(
        "You already reviewed this book. Please edit your review.",
      );
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating,
      comment,
      images: this.normalizeImagePaths(images),
    });

    return review;
  }

  // UC-58: Cập nhật review của chính mình (Edit own review)
  // Kiểm tra ownership, cập nhật rating/comment/images
  async updateOwnReview(userId, reviewId, payload) {
    const {
      rating,
      comment = "",
      images = [],
      keepExistingImages = [],
    } = payload;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    // Kiểm tra user có phải chủ sở hữu review không
    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You can only edit your own review");
    }

    review.rating = rating;
    review.comment = comment;
    // Gộp ảnh cũ (giữ lại) + ảnh mới upload, tối đa 5 ảnh
    const mergedImages = [
      ...this.normalizeImagePaths(keepExistingImages),
      ...this.normalizeImagePaths(images),
    ].slice(0, 5);
    review.images = mergedImages;
    review.isEdited = true;

    await review.save();

    return review;
  }

  // UC-82: Xóa review của chính mình
  async deleteOwnReview(userId, reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    // Kiểm tra quyền: chỉ chủ sở hữu mới có thể xóa
    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You can only delete your own review");
    }

    await Review.deleteOne({ _id: reviewId });
    return true;
  }

  // UC-84: Thêm/cập nhật/xóa phản ứng (helpful/dislike) của user cho review
  async reactToReview(userId, reviewId, type) {
    const normalizedType = String(type || "").toUpperCase();
    if (!["HELPFUL", "DISLIKE"].includes(normalizedType)) {
      throw ApiError.badRequest("Reaction type must be HELPFUL or DISLIKE");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    // User không được phép phản ứng trên review của chính mình
    if (review.user.toString() === userId.toString()) {
      throw ApiError.badRequest("You cannot react to your own review");
    }

    // Tìm xem user này đã phản ứng chưa
    const existingIndex = review.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId.toString(),
    );

    if (existingIndex >= 0) {
      const currentType = review.reactions[existingIndex].type;
      // Nếu nhấn loại phản ứng cũ, xóa phản ứng đó
      if (currentType === normalizedType) {
        review.reactions.splice(existingIndex, 1);
      } else {
        // Nếu nhấn loại khác, cập nhật phản ứng
        review.reactions[existingIndex].type = normalizedType;
        review.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      // Thêm phản ứng mới
      review.reactions.push({
        user: userId,
        type: normalizedType,
      });
    }

    await review.save();

    // Trả về reaction summary và phản ứng của user hiện tại
    const reactionSummary = this.getReactionSummary(review.reactions || []);
    const myReaction =
      review.reactions.find(
        (reaction) => reaction.user.toString() === userId.toString(),
      )?.type || null;

    return {
      reviewId: review._id,
      reactionSummary,
      myReaction,
    };
  }

  async ensureBookExists(bookId) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound("Book not found");
    }
  }

  // Kiểm tra user đã mua sách này chưa (chỉ user mua sách mới có thể review)
  async ensureUserPurchasedBook(userId, bookId) {
    const purchasedOrder = await Order.findOne({
      user: userId,
      orderStatus: "DELIVERED",
      "items.book": bookId,
    }).lean();

    if (!purchasedOrder) {
      throw ApiError.forbidden("You can only review books you have purchased");
    }
  }
}

export default new ReviewService();
