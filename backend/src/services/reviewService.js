import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";

class ReviewService {
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

  async getBookReviews(bookId, page = 1, limit = 10, options = {}) {
    const ratingFilter = this.parseRatingFilter(options.rating);
    const skip = (page - 1) * limit;
    const match = {
      book: new mongoose.Types.ObjectId(bookId),
    };

    if (ratingFilter) {
      match.rating = ratingFilter;
    }

    const [reviews, total, summaryResult] = await Promise.all([
      Review.find(match)
        .populate("user", "firstName lastName email")
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

    const normalizedReviews = reviews.map((review) => ({
      ...review,
      images: this.normalizeImagePaths(review.images || []),
      reactionSummary: this.getReactionSummary(review.reactions || []),
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

  async getMyReviewForBook(userId, bookId) {
    const review = await Review.findOne({ user: userId, book: bookId }).lean();
    if (!review) {
      return null;
    }

    return {
      ...review,
      images: this.normalizeImagePaths(review.images || []),
      reactionSummary: this.getReactionSummary(review.reactions || []),
    };
  }

  async createReview(userId, bookId, payload) {
    const { rating, comment = "", images = [] } = payload;

    await this.ensureBookExists(bookId);
    await this.ensureUserPurchasedBook(userId, bookId);

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

    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You can only edit your own review");
    }

    review.rating = rating;
    review.comment = comment;
    const mergedImages = [
      ...this.normalizeImagePaths(keepExistingImages),
      ...this.normalizeImagePaths(images),
    ].slice(0, 5);
    review.images = mergedImages;
    review.isEdited = true;

    await review.save();

    return review;
  }

  async deleteOwnReview(userId, reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You can only delete your own review");
    }

    await Review.deleteOne({ _id: reviewId });
    return true;
  }

  async reactToReview(userId, reviewId, type) {
    const normalizedType = String(type || "").toUpperCase();
    if (!["HELPFUL", "DISLIKE"].includes(normalizedType)) {
      throw ApiError.badRequest("Reaction type must be HELPFUL or DISLIKE");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    if (review.user.toString() === userId.toString()) {
      throw ApiError.badRequest("You cannot react to your own review");
    }

    const existingIndex = review.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId.toString(),
    );

    if (existingIndex >= 0) {
      const currentType = review.reactions[existingIndex].type;
      if (currentType === normalizedType) {
        review.reactions.splice(existingIndex, 1);
      } else {
        review.reactions[existingIndex].type = normalizedType;
        review.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      review.reactions.push({
        user: userId,
        type: normalizedType,
      });
    }

    await review.save();

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
