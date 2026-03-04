import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";

class ReviewService {
  async getBookReviews(bookId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, summaryResult] = await Promise.all([
      Review.find({ book: bookId })
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ book: bookId }),
      Review.aggregate([
        { $match: { book: new mongoose.Types.ObjectId(bookId) } },
        {
          $group: {
            _id: "$book",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = summaryResult[0] || { averageRating: 0, totalReviews: 0 };

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        averageRating: Math.round((summary.averageRating || 0) * 10) / 10,
        totalReviews: summary.totalReviews || 0,
      },
    };
  }

  async getMyReviewForBook(userId, bookId) {
    return Review.findOne({ user: userId, book: bookId }).lean();
  }

  async createReview(userId, bookId, payload) {
    const { rating, comment = "" } = payload;

    await this.ensureBookExists(bookId);
    await this.ensureUserPurchasedBook(userId, bookId);

    const existingReview = await Review.findOne({ user: userId, book: bookId });
    if (existingReview) {
      throw ApiError.conflict("You already reviewed this book. Please edit your review.");
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating,
      comment,
    });

    return review;
  }

  async updateOwnReview(userId, reviewId, payload) {
    const { rating, comment = "" } = payload;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You can only edit your own review");
    }

    review.rating = rating;
    review.comment = comment;
    review.isEdited = true;

    await review.save();

    return review;
  }

  async ensureBookExists(bookId) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound("Book not found");
    }
  }

  async ensureUserPurchasedBook(userId, bookId) {
    const purchasedOrder = await Order.findOne({
      user: userId,
      orderStatus: { $ne: "CANCELLED" },
      "items.book": bookId,
    }).lean();

    if (!purchasedOrder) {
      throw ApiError.forbidden("You can only review books you have purchased");
    }
  }
}

export default new ReviewService();
