import mongoose from "mongoose";
import Book from "../models/Book.js";
import FlashSaleCampaign from "../models/FlashSaleCampaign.js";
import ApiError from "../utils/ApiError.js";
import { BOOK_VISIBILITY } from "../config/constants.js";

// Các hằng số cấu hình cho flash sale
const MIN_DISCOUNT_PERCENT = 10; // Giảm giá tối thiểu
const MAX_DISCOUNT_PERCENT = 50; // Giảm giá tối đa
const MAX_DURATION_MINUTES = 30; // Thời lượng tối đa (phút)
const DEFAULT_DURATION_MINUTES = 10; // Thời lượng mặc định (phút)
const MAX_BOOKS_PER_CAMPAIGN = 5; // Số sách tối đa trong một chiến dịch

// Service để xử lý logic liên quan đến flash sale
class FlashSaleService {
  // Xác thực và chuẩn hóa thời lượng của chiến dịch flash sale (tính bằng phút)
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

  // Xác thực và chuẩn hóa danh sách sách tham gia flash sale
  normalizeFlashSaleItems(items) {
    // Kiểm tra phải có đúng 5 sách
    if (!Array.isArray(items) || items.length !== MAX_BOOKS_PER_CAMPAIGN) {
      throw ApiError.badRequest(`Please select exactly ${MAX_BOOKS_PER_CAMPAIGN} books`);
    }

    const seenIds = new Set();

    return items.map((item, index) => {
      // Lấy bookId từ các trường có thể
      const bookId = item?.bookId || item?.book || item?._id;
      if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
        throw ApiError.badRequest(`Invalid book at slot ${index + 1}`);
      }

      const normalizedId = String(bookId);
      // Kiểm tra không được trùng sách
      if (seenIds.has(normalizedId)) {
        throw ApiError.badRequest("Duplicate books are not allowed in flash sale");
      }
      seenIds.add(normalizedId);

      // Xác thực phần trăm giảm giá
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

  // Kiểm tra các sách có tồn tại và là công khai (public)
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

  // Lấy chiến dịch flash sale hiện tại (đang hoạt động và trong thời gian)
  async getCurrentCampaign() {
    const now = new Date();

    // Tự động cập nhật trạng thái: vô hiệu hóa những chiến dịch đã hết hạn
    await FlashSaleCampaign.updateMany(
      { isActive: true, endsAt: { $lte: now } },
      { $set: { isActive: false } },
    );

    // Tìm chiến dịch đang hoạt động
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

  // Chuyển đổi dữ liệu chiến dịch từ database thành DTO (Data Transfer Object) cho frontend
  mapCampaignToDto(campaign) {
    if (!campaign) return null;

    const now = Date.now();
    // Tính thời gian còn lại (tính bằng milliseconds)
    const remainingMs = Math.max(0, new Date(campaign.endsAt).getTime() - now);

    // Biến đổi danh sách sách: thêm giá flash sale và các thông tin khác
    const books = (campaign.books || [])
      .filter((item) => item?.book)
      .map((item) => {
        const originalPrice = Number(item.book.price || 0);
        // Tính số tiền giảm giá
        const discountAmount = Math.round((originalPrice * item.discountPercent) / 100);
        // Tính giá flash sale (sau giảm)
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

  // Lấy thông tin flash sale đang hoạt động dưới dạng DTO
  async getActiveFlashSale() {
    const campaign = await this.getCurrentCampaign();
    return this.mapCampaignToDto(campaign);
  }

  // Lấy bản đồ giảm giá của chiến dịch hiện tại: { bookId -> discountPercent }
  // Dùng để tính giá trên giỏ hàng, checkout, etc.
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

  // Tạo mới hoặc cập nhật chiến dịch flash sale
  async upsertCurrentFlashSale(payload, adminId) {
    // Xác thực danh sách sách
    const items = this.normalizeFlashSaleItems(payload?.books);
    // Xác thực thời lượng
    const durationMinutes = this.normalizeDurationMinutes(payload?.durationMinutes);

    // Kiểm tra các sách có tồn tại
    await this.validateBooksExist(items);

    const startsAt = new Date();
    // Tính thời điểm kết thúc dựa vào thời lượng
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

    // Vô hiệu hóa tất cả chiến dịch flash sale trước đó đang hoạt động
    await FlashSaleCampaign.updateMany({ isActive: true }, { $set: { isActive: false } });

    // Tạo chiến dịch flash sale mới
    const campaign = await FlashSaleCampaign.create({
      books: items,
      startsAt,
      endsAt,
      isActive: true,
      createdBy: adminId || undefined,
    });

    // Lấy lại chiến dịch vừa tạo với đầy đủ thông tin sách
    const populatedCampaign = await FlashSaleCampaign.findById(campaign._id)
      .populate({
        path: "books.book",
        select: "title author price imageUrl stock category visibility",
        populate: { path: "category", select: "name" },
      })
      .lean();

    return this.mapCampaignToDto(populatedCampaign);
  }

  // Xóa/hủy tất cả chiến dịch flash sale đang hoạt động
  async clearCurrentFlashSale() {
    const result = await FlashSaleCampaign.updateMany(
      { isActive: true },
      { $set: { isActive: false } },
    );

    return result.modifiedCount || 0;
  }

  // Lấy các cài đặt flash sale (dùng cho admin panel)
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
