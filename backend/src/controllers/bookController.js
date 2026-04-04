import bookService from "../services/bookService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS, MESSAGES } from "../config/constants.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");

class BookController {
  // UC-11: Controller xử lý request lấy danh sách sách công khai
  // Endpoint: GET /api/books (có query params cho filter và pagination)
  // Luồng xử lý:
  // 1. Nhận req.query chứa filters (category, author, price range, search, page, limit)
  // 2. Gọi bookService.getPublicBooks() để xử lý logic nghiệp vụ
  // 3. Trả về response thành công với data books và pagination
  // 4. Nếu có lỗi, chuyển cho error handler middleware
  async getPublicBooks(req, res, next) {
    try {
      // Lấy filters từ query parameters và gọi service
      const result = await bookService.getPublicBooks(req.query);

      // Trả về response thành công với dữ liệu sách và pagination
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOKS_FETCHED,
        result,
      );
    } catch (error) {
      // Chuyển lỗi cho middleware error handler
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
  // UC-15: Controller xử lý request lấy chi tiết sách
  // Endpoint: GET /api/books/:id
  // Luồng xử lý:
  // 1. Nhận book ID từ URL params
  // 2. Gọi bookService.getBookById() để lấy thông tin sách
  // 3. Nếu user đã đăng nhập, thêm sách vào recently viewed
  // 4. Trả về response thành công với data book
  // 5. Nếu có lỗi, chuyển cho error handler middleware
  async getBookById(req, res, next) {
    try {
      // Lấy thông tin sách từ service theo ID
      const book = await bookService.getBookById(req.params.id);

      // Nếu user đã đăng nhập, lưu sách vào recently viewed
      if (req.user) {
        await bookService.addToRecentlyViewed(req.user._id, req.params.id);
      }

      // Trả về response thành công với dữ liệu sách
      return ApiResponse.success(res, HTTP_STATUS.OK, MESSAGES.BOOK_FETCHED, {
        book,
      });
    } catch (error) {
      // Chuyển lỗi cho middleware error handler
      next(error);
    }
  }

  // UC-60: Lấy sách bán chạy nhất cho homepage
  // Endpoint: GET /books/best-selling?limit=8
  // Luồng xử lý:
  // 1. Nhận query parameter limit (mặc định 8)
  // 2. Gọi bookService.getBestSellingBooks() để lấy dữ liệu từ DB
  // 3. Trả về response thành công với danh sách sách
  // 4. Nếu có lỗi, chuyển cho error handler
  async getBestSellingBooks(req, res, next) {
    try {
      // Lấy limit từ query params, mặc định 8 sách
      const limit = req.query.limit ? parseInt(req.query.limit) : 8;

      // Gọi service để lấy danh sách sách bán chạy
      const books = await bookService.getBestSellingBooks(limit);

      // Trả về response thành công với dữ liệu sách
      return ApiResponse.success(res, HTTP_STATUS.OK, MESSAGES.BOOKS_FETCHED, {
        books,
      });
    } catch (error) {
      // Chuyển lỗi cho middleware error handler
      next(error);
    }
  }

  // UC-86: API endpoint lấy danh sách sách cá nhân hóa
  // ===================================================
  // Endpoint: GET /books/personalized?limit=8
  // Frontend: bookApi.getPersonalizedBooks(8) → HomePage.jsx fetchPersonalizedBooks()
  // 
  // Luồng xử lý:
  // 1. Trích xuất userId từ request.user (null nếu guest)
  // 2. Trích xuất query params: limit, searchHistory, searchTerms
  // 3. Trích xuất metadata từ headers: language, platform, location
  // 4. Gọi bookService.getPersonalizedBooks(userId, options)
  // 5. Trả về response với books + strategy + signals cho frontend
  async getPersonalizedBooks(req, res, next) {
    try {
      // Bước 1: Lấy limit từ query params, mặc định 8 sách, tối đa PAGINATION.MAX_LIMIT
      // Ví dụ: GET /books/personalized?limit=10 → limit = 10
      const limit = req.query.limit ? parseInt(req.query.limit) : 8;
      
      // Bước 2: Lấy userId từ authenticated user (req.user._id)
      // Nếu user chưa login → userId = null (guest)
      const userId = req.user?._id || null;
      
      // Bước 3: Lấy search terms từ query params (nếu có)
      // Có thể là searchHistory hoặc searchTerms, split bằng dấu phẩy
      const rawSearch = req.query.searchHistory || req.query.searchTerms || "";
      const searchTerms = String(rawSearch)
        .split(",")  // Split bằng dấu phẩy
        .map((term) => term.trim())  // Trim whitespace
        .filter(Boolean);  // Loại bỏ empty strings

      // Bước 4: Trích xuất metadata từ request headers (cho personalization algorithm)
      // Accept-Language header: Lấy language preference của user (VD: "vi-VN,vi;q=0.9")
      const acceptLanguage = req.headers["accept-language"];
      const language = acceptLanguage
        ? String(acceptLanguage).split(",")[0]?.trim() || null  // Lấy language đầu tiên
        : null;
      
      // Platform header: Lấy device type (desktop, mobile, tablet)
      // Có thể từ sec-ch-ua-platform header hoặc x-platform custom header
      const platform =
        req.headers["sec-ch-ua-platform"] ||
        req.headers["x-platform"] ||
        req.headers["user-agent"] ||
        null;
      
      // Location header: Lấy vị trí địa lý của user (Cloudflare hoặc custom header)
      // Dùng để personalize theo region (VD: Vietnam, USA)
      const location =
        req.headers["x-country-code"] ||
        req.headers["cf-ipcountry"] ||
        req.headers["x-geo-country"] ||
        null;

      // Bước 5: Gọi service để lấy danh sách sách cá nhân hóa
      // Service sẽ apply recommendation algorithm dựa trên userId + cart + metadata
      const result = await bookService.getPersonalizedBooks(userId, {
        limit,
        searchTerms,
        language,
        platform,
        location,
      });

      // Bước 6: Trả về response thành công với kết quả
      // Response gồm:
      // - books: Mảng 8 sách recommend
      // - strategy: "cart-author-category" hoặc "fallback-newest"
      // - signals: Metadata để frontend debug/analytics
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Personalized books fetched",  // Message thành công
        result,  // Data: { books, strategy, signals }
      );
    } catch (error) {
      // Nếu có lỗi → Chuyển cho error handler middleware
      next(error);
    }
  }

  async checkEbookAccess(req, res, next) {
    try {
      const result = await bookService.checkEbookAccess(req.user._id, req.params.id);
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book access checked",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyEbooks(req, res, next) {
    try {
      const ebooks = await bookService.getMyEbooks(req.user._id);

      return ApiResponse.success(res, HTTP_STATUS.OK, "E-books fetched", {
        ebooks,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEbookReaderState(req, res, next) {
    try {
      const result = await bookService.getEbookReaderState(
        req.user._id,
        req.params.id,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book reader state fetched",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateEbookReaderProgress(req, res, next) {
    try {
      const result = await bookService.updateEbookReaderProgress(
        req.user._id,
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book progress saved",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateEbookReaderSettings(req, res, next) {
    try {
      const result = await bookService.updateEbookReaderSettings(
        req.user._id,
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book reader settings saved",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async addEbookBookmark(req, res, next) {
    try {
      const result = await bookService.addEbookBookmark(
        req.user._id,
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book bookmark added",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteEbookBookmark(req, res, next) {
    try {
      const result = await bookService.deleteEbookBookmark(
        req.user._id,
        req.params.id,
        req.params.bookmarkId,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book bookmark deleted",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async addEbookAnnotation(req, res, next) {
    try {
      const result = await bookService.addEbookAnnotation(
        req.user._id,
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book annotation added",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateEbookAnnotation(req, res, next) {
    try {
      const result = await bookService.updateEbookAnnotation(
        req.user._id,
        req.params.id,
        req.params.annotationId,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book annotation updated",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteEbookAnnotation(req, res, next) {
    try {
      const result = await bookService.deleteEbookAnnotation(
        req.user._id,
        req.params.id,
        req.params.annotationId,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "E-book annotation deleted",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async streamEbookFile(req, res, next) {
    try {
      const ebookRelPath = await bookService.getEbookFilePath(req.user._id, req.params.id);

      // Validate the path is within the expected directory to prevent path traversal
      if (!ebookRelPath.startsWith("/uploads/ebooks/")) {
        return next(new Error("Invalid e-book path"));
      }

      const absolutePath = path.join(
        uploadsRoot,
        ebookRelPath.replace(/^\/uploads/, ""),
      );

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: "E-book file not found on server" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      fs.createReadStream(absolutePath).pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new BookController();
