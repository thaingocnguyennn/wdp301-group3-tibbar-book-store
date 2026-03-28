import mongoose from "mongoose";
import Book from "../models/Book.js";
import FlashSaleCampaign from "../models/FlashSaleCampaign.js";
import ApiError from "../utils/ApiError.js";
import { BOOK_VISIBILITY } from "../config/constants.js";

const MIN_DISCOUNT_PERCENT = 10;
const MAX_DISCOUNT_PERCENT = 50;
const MAX_DURATION_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 10;
const MAX_BOOKS_PER_CAMPAIGN = 5;

class FlashSaleService {
  normalizeDurationMinutes(value) {
    const normalized = Number(value ?? DEFAULT_DURATION_MINUTES);

    if (!Number.isFinite(normalized) || !Number.isInteger(normalized)) {
      throw ApiError.badRequest("Duration must be an integer in minutes");
    }

    if (normalized < 1 || normalized > MAX_DURATION_MINUTES) {
      throw ApiError.badRequest(
        `Duration must be between 1 and ${MAX_DURATION_MINUTES} minutes`,
      );
    }

    return normalized;
  }

  normalizeFlashSaleItems(items) {
    if (!Array.isArray(items) || items.length !== MAX_BOOKS_PER_CAMPAIGN) {
      throw ApiError.badRequest(`Please select exactly ${MAX_BOOKS_PER_CAMPAIGN} books`);
    }

    const seenIds = new Set();

    return items.map((item, index) => {
      const bookId = item?.bookId || item?.book || item?._id;
      if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
        throw ApiError.badRequest(`Invalid book at slot ${index + 1}`);
      }

      const normalizedId = String(bookId);
      if (seenIds.has(normalizedId)) {
        throw ApiError.badRequest("Duplicate books are not allowed in flash sale");
      }
      seenIds.add(normalizedId);

      const discountPercent = Number(item?.discountPercent);
      if (!Number.isFinite(discountPercent) || !Number.isInteger(discountPercent)) {
        throw ApiError.badRequest(`Discount at slot ${index + 1} must be an integer`);
      }

      if (
        discountPercent < MIN_DISCOUNT_PERCENT ||
        discountPercent > MAX_DISCOUNT_PERCENT
      ) {
        throw ApiError.badRequest(
          `Discount at slot ${index + 1} must be between ${MIN_DISCOUNT_PERCENT}% and ${MAX_DISCOUNT_PERCENT}%`,
        );
      }

      return {
        book: normalizedId,
        discountPercent,
      };
    });
  }

  async validateBooksExist(items) {
    const bookIds = items.map((item) => item.book);
    const books = await Book.find({
      _id: { $in: bookIds },
      visibility: BOOK_VISIBILITY.PUBLIC,
    })
      .select("_id")
      .lean();

    if (books.length !== items.length) {
      throw ApiError.badRequest("Some selected books are missing or not public");
    }
  }

  async getCurrentCampaign() {
    const now = new Date();

    await FlashSaleCampaign.updateMany(
      { isActive: true, endsAt: { $lte: now } },
      { $set: { isActive: false } },
    );

    const campaign = await FlashSaleCampaign.findOne({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "books.book",
        select: "title author price imageUrl stock category visibility",
        populate: { path: "category", select: "name" },
      })
      .lean();

    return campaign || null;
  }

  mapCampaignToDto(campaign) {
    if (!campaign) return null;

    const now = Date.now();
    const remainingMs = Math.max(0, new Date(campaign.endsAt).getTime() - now);

    const books = (campaign.books || [])
      .filter((item) => item?.book)
      .map((item) => {
        const originalPrice = Number(item.book.price || 0);
        const discountAmount = Math.round((originalPrice * item.discountPercent) / 100);
        const flashSalePrice = Math.max(0, originalPrice - discountAmount);

        return {
          _id: item.book._id,
          title: item.book.title,
          author: item.book.author,
          imageUrl: item.book.imageUrl,
          stock: item.book.stock,
          category: item.book.category || null,
          originalPrice,
          discountPercent: item.discountPercent,
          flashSalePrice,
        };
      });

    return {
      _id: campaign._id,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      remainingMs,
      books,
    };
  }

  async getActiveFlashSale() {
    const campaign = await this.getCurrentCampaign();
    return this.mapCampaignToDto(campaign);
  }

  // Get discount map for current flash sale: { bookId -> discountPercent }
  async getFlashSaleDiscountMap() {
    const campaign = await this.getCurrentCampaign();
    if (!campaign) return {};

    return (campaign.books || []).reduce((map, item) => {
      if (item?.book?._id) {
        map[item.book._id.toString()] = item.discountPercent;
      }
      return map;
    }, {});
  }

  async upsertCurrentFlashSale(payload, adminId) {
    const items = this.normalizeFlashSaleItems(payload?.books);
    const durationMinutes = this.normalizeDurationMinutes(payload?.durationMinutes);

    await this.validateBooksExist(items);

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

    await FlashSaleCampaign.updateMany({ isActive: true }, { $set: { isActive: false } });

    const campaign = await FlashSaleCampaign.create({
      books: items,
      startsAt,
      endsAt,
      isActive: true,
      createdBy: adminId || undefined,
    });

    const populatedCampaign = await FlashSaleCampaign.findById(campaign._id)
      .populate({
        path: "books.book",
        select: "title author price imageUrl stock category visibility",
        populate: { path: "category", select: "name" },
      })
      .lean();

    return this.mapCampaignToDto(populatedCampaign);
  }

  async clearCurrentFlashSale() {
    const result = await FlashSaleCampaign.updateMany(
      { isActive: true },
      { $set: { isActive: false } },
    );

    return result.modifiedCount || 0;
  }

  getSettings() {
    return {
      minDiscountPercent: MIN_DISCOUNT_PERCENT,
      maxDiscountPercent: MAX_DISCOUNT_PERCENT,
      maxDurationMinutes: MAX_DURATION_MINUTES,
      defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
      requiredBookCount: MAX_BOOKS_PER_CAMPAIGN,
    };
  }
}

export default new FlashSaleService();
