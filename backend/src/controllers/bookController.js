import bookService from "../services/bookService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS, MESSAGES } from "../config/constants.js";

class BookController {
  async getPublicBooks(req, res, next) {
    try {
      const result = await bookService.getPublicBooks(req.query);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOKS_FETCHED,
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getNewestBooks(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const books = await bookService.getNewestBooks(limit);

      return ApiResponse.success(res, HTTP_STATUS.OK, MESSAGES.BOOKS_FETCHED, {
        books,
      });
    } catch (error) {
      next(error);
    }
  }

  // Phương thức để lấy danh sách sách đã xem gần đây của người dùng
  async getRecentlyViewed(req, res, next) {
    try {
      const books = await bookService.getRecentlyViewed(req.user._id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Recently viewed fetched",
        { books },
      );
    } catch (error) {
      next(error);
    }
  }
  async getBookById(req, res, next) {
    try {
      const book = await bookService.getBookById(req.params.id);
      // Lưu recently viewed khi user xem chi tiết
      if (req.user) {
        await bookService.addToRecentlyViewed(req.user._id, req.params.id);
      }

      return ApiResponse.success(res, HTTP_STATUS.OK, MESSAGES.BOOK_FETCHED, {
        book,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBestSellingBooks(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 8;
      const books = await bookService.getBestSellingBooks(limit);

      return ApiResponse.success(res, HTTP_STATUS.OK, MESSAGES.BOOKS_FETCHED, {
        books,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPersonalizedBooks(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 8;
      const userId = req.user?._id || null;
      const rawSearch = req.query.searchHistory || req.query.searchTerms || "";
      const searchTerms = String(rawSearch)
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);

      const acceptLanguage = req.headers["accept-language"];
      const language = acceptLanguage
        ? String(acceptLanguage).split(",")[0]?.trim() || null
        : null;
      const platform =
        req.headers["sec-ch-ua-platform"] ||
        req.headers["x-platform"] ||
        req.headers["user-agent"] ||
        null;
      const location =
        req.headers["x-country-code"] ||
        req.headers["cf-ipcountry"] ||
        req.headers["x-geo-country"] ||
        null;

      const result = await bookService.getPersonalizedBooks(userId, {
        limit,
        searchTerms,
        language,
        platform,
        location,
      });

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Personalized books fetched",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new BookController();
