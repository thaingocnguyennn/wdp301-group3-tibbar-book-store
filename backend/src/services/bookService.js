import Book from "../models/Book.js";
import Category from "../models/Category.js";
import Cart from "../models/Cart.js";
// FIX: getBestSellingBooks uses Order.aggregate, so Order model must be imported.
import Order from "../models/Order.js";
import EbookReaderState from "../models/EbookReaderState.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES, PAGINATION, BOOK_VISIBILITY } from "../config/constants.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");

class BookService {
  getDefaultReaderSettings() {
    return {
      theme: "dark",
      fontSize: 18,
      fontFamily: "serif",
      lineSpacing: 1.6,
      zoomPercent: 100,
    };
  }

  resolveAbsoluteEbookPath(ebookRelPath = "") {
    if (!ebookRelPath || !ebookRelPath.startsWith("/uploads/ebooks/")) {
      return null;
    }

    return path.join(uploadsRoot, ebookRelPath.replace(/^\/uploads/, ""));
  }

  estimatePdfTotalPages(ebookRelPath = "") {
    const absolutePath = this.resolveAbsoluteEbookPath(ebookRelPath);
    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return 0;
    }

    try {
      const pdfContent = fs.readFileSync(absolutePath).toString("latin1");
      const pageMatches = pdfContent.match(/\/Type\s*\/Page\b/g);
      if (pageMatches?.length) {
        return pageMatches.length;
      }

      const countMatches = [...pdfContent.matchAll(/\/Count\s+(\d+)/g)]
        .map((match) => Number(match[1]))
        .filter((value) => Number.isFinite(value) && value > 0);

      return countMatches.length ? Math.max(...countMatches) : 0;
    } catch {
      return 0;
    }
  }

  async requireReadableEbook(userId, bookId) {
    const book = await Book.findById(bookId)
      .select("title author imageUrl isEbook ebookFile ebookMetadata")
      .lean();

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    if (!book.isEbook || !book.ebookFile) {
      throw ApiError.notFound("E-book not available");
    }

    const access = await this.checkEbookAccess(userId, bookId);
    if (!access.hasAccess) {
      throw ApiError.forbidden("Please complete payment to read this e-book.");
    }

    return book;
  }

  normalizeReaderProgress(progress = {}, totalPages = 0) {
    const safeTotalPages = Number(totalPages) > 0 ? Number(totalPages) : 0;
    const currentPageRaw = Number(progress?.currentPage || 1);
    const scrollOffsetRaw = Number(progress?.scrollOffset || 0);
    const currentPage =
      safeTotalPages > 0
        ? Math.min(Math.max(currentPageRaw, 1), safeTotalPages)
        : Math.max(currentPageRaw, 1);
    const completionPercent =
      safeTotalPages > 0
        ? Math.min(100, Math.max(0, Number(((currentPage / safeTotalPages) * 100).toFixed(1))))
        : Math.min(100, Math.max(0, Number(progress?.completionPercent || 0)));

    return {
      currentPage,
      completionPercent,
      scrollOffset: Number.isFinite(scrollOffsetRaw) && scrollOffsetRaw >= 0 ? scrollOffsetRaw : 0,
      lastReadAt: progress?.lastReadAt || null,
    };
  }

  buildReaderStatePayload(book, readerState = null) {
    const totalPages =
      Number(book?.ebookMetadata?.totalPages || 0) ||
      this.estimatePdfTotalPages(book?.ebookFile || "");
    const toc = Array.isArray(book?.ebookMetadata?.toc)
      ? book.ebookMetadata.toc
          .filter((item) => item?.title && Number(item?.page) > 0)
          .map((item) => ({
            title: item.title,
            page: Number(item.page),
          }))
      : [];
    const defaultSettings = this.getDefaultReaderSettings();

    return {
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl || "",
        totalPages,
        toc,
      },
      readerState: {
        progress: this.normalizeReaderProgress(readerState?.progress, totalPages),
        settings: {
          ...defaultSettings,
          ...(readerState?.settings || {}),
        },
        bookmarks: Array.isArray(readerState?.bookmarks)
          ? readerState.bookmarks
          : [],
        annotations: Array.isArray(readerState?.annotations)
          ? readerState.annotations
          : [],
      },
      capabilities: {
        supportsPdfPageTracking: true,
        supportsAutomaticScrollTracking: false,
        supportsTypographyControlsOnPdf: false,
        supportsInlinePdfHighlights: false,
        supportsToc: toc.length > 0,
      },
    };
  }

  async findOrCreateReaderState(userId, bookId) {
    let state = await EbookReaderState.findOne({ user: userId, book: bookId });
    if (!state) {
      state = await EbookReaderState.create({
        user: userId,
        book: bookId,
      });
    }

    return state;
  }

  sanitizePublicBook(book) {
    if (!book) return book;

    const { ebookFile, ...safeBook } = book;
    return safeBook;
  }

  sanitizePublicBooks(books = []) {
    return books.map((book) => this.sanitizePublicBook(book));
  }

  // UC-11: Hiển thị danh sách sách có sẵn (Book list)
  // Luồng xử lý: Từ HomePage, user xem danh sách sách công khai với khả năng filter và pagination
  // Bắt đầu: User truy cập HomePage, component tự động gọi fetchBooks()
  // Xử lý chính: bookService.getPublicBooks() xây dựng query MongoDB với các filter criteria
  // Cuối cùng: Trả về danh sách books và pagination info, hiển thị trên UI HomePage
  async getPublicBooks(filters = {}) {
    // Trích xuất các filter parameters từ input
    const {
      category,    // Filter theo category ID
      author,      // Filter theo tác giả (regex case-insensitive)
      minPrice,    // Filter giá tối thiểu
      maxPrice,    // Filter giá tối đa
      search,      // Tìm kiếm full-text
      page = PAGINATION.DEFAULT_PAGE,     // Trang hiện tại (mặc định 1)
      limit = PAGINATION.DEFAULT_LIMIT,   // Số sách mỗi trang (mặc định 12)
    } = filters;

    // Khởi tạo query cơ bản: chỉ lấy sách có visibility PUBLIC
    const query = { visibility: BOOK_VISIBILITY.PUBLIC };

    // Áp dụng filter theo category nếu được chỉ định
    if (category) {
      query.category = category;
    }

    // Áp dụng filter theo tác giả với regex case-insensitive
    if (author) {
      query.author = new RegExp(author, "i");
    }

    // Áp dụng filter theo khoảng giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      // Lọc giá >= minPrice nếu có
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      // Lọc giá <= maxPrice nếu có
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Áp dụng tìm kiếm full-text nếu có search term
    if (search) {
      query.$text = { $search: search };
    }

    // Tính toán skip cho pagination
    const skip = (Number(page) - 1) * Number(limit);
    // Giới hạn limit tối đa để tránh quá tải
    const actualLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);

    // Thực hiện query song song: lấy books và đếm tổng số
    const [books, totalBooks] = await Promise.all([
      // Query books với filters, populate category, loại bỏ ebookFile
      Book.find(query)
        .populate("category", "name")  // Populate tên category
        .select("-ebookFile")          // Loại bỏ field ebookFile khỏi kết quả
        .skip(skip)                    // Bỏ qua records theo pagination
        .limit(actualLimit)            // Giới hạn số records trả về
        .sort({ createdAt: -1 })       // Sort theo thời gian tạo giảm dần (mới nhất trước)
        .lean(),                       // Trả về plain object thay vì Mongoose document
      // Đếm tổng số books match query để tính pagination
      Book.countDocuments(query),
    ]);

    // Trả về kết quả với books đã sanitize và thông tin pagination
    return {
      books: this.sanitizePublicBooks(books),  // Sanitize dữ liệu sách công khai
      pagination: {
        currentPage: Number(page),                    // Trang hiện tại
        totalPages: Math.ceil(totalBooks / actualLimit), // Tổng số trang
        totalBooks,                                   // Tổng số sách
        limit: actualLimit,                            // Số sách mỗi trang
      },
    };
  }

  // UC-13: Lấy sách mới nhất (Newest book)
  // Luồng xử lý: Hiển thị sách được thêm gần đây nhất trên homepage
  // Bắt đầu: HomePage gọi fetchPersonalizedBooks(), nếu không có personalized thì fallback sang getNewestBooks()
  // Xử lý chính: Query MongoDB lấy sách PUBLIC, sort theo createdAt giảm dần, limit số lượng
  // Cuối cùng: Trả về danh sách sách mới nhất, hiển thị trong section "Có thể bạn quan tâm"
  async getNewestBooks(limit = 10) {
    // Query lấy sách có visibility PUBLIC
    const books = await Book.find({ visibility: BOOK_VISIBILITY.PUBLIC })
      .populate("category", "name")  // Populate thông tin category (chỉ lấy name)
      .select("-ebookFile")          // Loại bỏ field ebookFile (không cần cho display)
      .sort({ createdAt: -1 })       // Sort theo thời gian tạo giảm dần (mới nhất trước)
      .limit(limit)                  // Giới hạn số lượng sách trả về
      .lean();                       // Trả về plain object để tối ưu performance

    // Sanitize dữ liệu sách công khai trước khi trả về
    return this.sanitizePublicBooks(books);
  }

  // UC-60: Lấy danh sách sách bán chạy nhất (Best selling book)
  // Luồng xử lý: Aggregate từ collection Order để tính tổng số lượng bán của mỗi sách
  // Chỉ tính các đơn hàng đã giao thành công (DELIVERED), sau đó sort theo số lượng bán giảm dần
  // Cuối cùng populate thông tin sách và category, chỉ trả về sách có visibility PUBLIC
  async getBestSellingBooks(limit = 8) {
    // Giới hạn số lượng sách trả về, tối đa PAGINATION.MAX_LIMIT
    const actualLimit = Math.min(Number(limit) || 8, PAGINATION.MAX_LIMIT);

    // Pipeline aggregate MongoDB để tính toán sách bán chạy
    const bestSellers = await Order.aggregate([
      // Bước 1: Lọc chỉ lấy các đơn hàng đã giao thành công
      // Điều kiện: orderStatus phải là "DELIVERED"
      {
        $match: {
          orderStatus: "DELIVERED",
        },
      },
      // Bước 2: Unwind mảng items để mỗi item thành một document riêng
      // Điều này cho phép group theo từng sách trong đơn hàng
      { $unwind: "$items" },
      // Bước 3: Group theo ID sách, tính tổng số lượng bán và doanh thu
      // _id: ID của sách (items.book)
      // soldQuantity: Tổng số lượng bán (sum của items.quantity)
      // soldRevenue: Tổng doanh thu (sum của items.subtotal)
      {
        $group: {
          _id: "$items.book",
          soldQuantity: { $sum: "$items.quantity" },
          soldRevenue: { $sum: "$items.subtotal" },
        },
      },
      // Bước 4: Sort theo số lượng bán giảm dần, sau đó theo doanh thu giảm dần
      // Ưu tiên sách bán nhiều nhất
      { $sort: { soldQuantity: -1, soldRevenue: -1 } },
      // Bước 5: Giới hạn số lượng kết quả trả về
      { $limit: actualLimit },
      // Bước 6: Lookup thông tin sách từ collection "books"
      // Liên kết theo _id (ID sách) để lấy chi tiết sách
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      // Bước 7: Unwind mảng book để chuyển thành object
      { $unwind: "$book" },
      // Bước 8: Lọc chỉ lấy sách có visibility PUBLIC
      // Loại bỏ sách ẩn hoặc riêng tư
      {
        $match: {
          "book.visibility": BOOK_VISIBILITY.PUBLIC,
        },
      },
      // Bước 9: Lookup thông tin category từ collection "categories"
      // Liên kết theo book.category để lấy tên category
      {
        $lookup: {
          from: "categories",
          localField: "book.category",
          foreignField: "_id",
          as: "category",
        },
      },
      // Bước 10: Thêm field category vào book object
      // Nếu có category thì lấy _id và name, ngược lại null
      {
        $addFields: {
          "book.category": {
            $cond: [
              { $gt: [{ $size: "$category" }, 0] },
              {
                _id: { $arrayElemAt: ["$category._id", 0] },
                name: { $arrayElemAt: ["$category.name", 0] },
              },
              null,
            ],
          },
        },
      },
      // Bước 11: Merge thông tin sách với soldQuantity và soldRevenue
      // Thay thế root document bằng object kết hợp
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$book",
              {
                soldQuantity: "$soldQuantity",
                soldRevenue: "$soldRevenue",
              },
            ],
          },
        },
      },
    ]);

    // Sanitize dữ liệu sách công khai trước khi trả về
    return this.sanitizePublicBooks(bestSellers);
  }

  async getPersonalizedBooks(userId, options = {}) {
    const actualLimit = Math.min(Number(options.limit) || 8, PAGINATION.MAX_LIMIT);

    const normalizeAuthor = (value = "") => String(value).trim();
    const dedupeAuthorsCaseInsensitive = (authors = []) => {
      const seen = new Set();
      const uniqueAuthors = [];

      for (const rawAuthor of authors) {
        const author = normalizeAuthor(rawAuthor);
        if (!author) continue;

        const authorKey = author.toLowerCase();
        if (!seen.has(authorKey)) {
          seen.add(authorKey);
          uniqueAuthors.push(author);
        }
      }

      return uniqueAuthors;
    };

    const dedupeIds = (values = []) => [
      ...new Set(
        values
          .map((value) => value?._id?.toString?.() || value?.toString?.())
          .filter(Boolean),
      ),
    ];

    const newestFallback = async (strategy = "fallback-newest", signals = {}) => {
      const books = await Book.find({ visibility: BOOK_VISIBILITY.PUBLIC })
        .populate("category", "name")
        .select("-ebookFile")
        .sort({ createdAt: -1 })
        .limit(actualLimit)
        .lean();

      return { books: this.sanitizePublicBooks(books), strategy, signals };
    };

    // Guest users: Recommend For You behaves like Newest.
    if (!userId) {
      return newestFallback("fallback-newest", {
        hasRecentlyViewed: false,
        hasCartHistory: false,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasAuthorInterest: false,
        hasCategoryInterest: false,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
      });
    }

    const [user, cart] = await Promise.all([
      User.findById(userId)
        .select("updatedAt")
        .lean(),
      Cart.findOne({ user: userId }).select("items.book updatedAt").lean(),
    ]);

    const cartBookIds = Array.isArray(cart?.items)
      ? cart.items.map((item) => item.book?.toString()).filter(Boolean)
      : [];

    // Logged-in users without cart history: fallback to newest.
    if (!cartBookIds.length) {
      return newestFallback("fallback-newest", {
        hasRecentlyViewed: false,
        hasCartHistory: false,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasAuthorInterest: false,
        hasCategoryInterest: false,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
        lastAccessAt: user?.updatedAt || null,
      });
    }

    const cartBooks = await Book.find({
      _id: { $in: cartBookIds },
      visibility: BOOK_VISIBILITY.PUBLIC,
    })
      .select("author category")
      .lean();

    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const preferredAuthors = dedupeAuthorsCaseInsensitive([
      ...cartBooks.map((book) => book.author),
    ]);

    const preferredCategoryIds = dedupeIds([
      ...cartBooks.map((book) => book.category),
    ]);

    if (!preferredAuthors.length && !preferredCategoryIds.length) {
      return newestFallback("fallback-newest-relaxed", {
        hasRecentlyViewed: false,
        hasCartHistory: cartBookIds.length > 0,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasAuthorInterest: false,
        hasCategoryInterest: false,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
        lastAccessAt: user?.updatedAt || null,
      });
    }

    const matchConditions = [];

    if (preferredAuthors.length) {
      const authorRegex = preferredAuthors.map(
        (author) => new RegExp(`^${escapeRegex(author)}$`, "i"),
      );
      matchConditions.push({ author: { $in: authorRegex } });
    }

    if (preferredCategoryIds.length) {
      matchConditions.push({ category: { $in: preferredCategoryIds } });
    }

    let candidates = [];
    if (matchConditions.length) {
      candidates = await Book.find({
        visibility: BOOK_VISIBILITY.PUBLIC,
        _id: { $nin: cartBookIds },
        $or: matchConditions,
      })
        .populate("category", "name")
        .select("-ebookFile")
        .sort({ createdAt: -1 })
        .limit(actualLimit * 6)
        .lean();
    }

    const authorMatchSet = new Set(preferredAuthors.map((author) => author.toLowerCase()));
    const categoryMatchSet = new Set(preferredCategoryIds.map((id) => id.toString()));

    const scoredCandidates = candidates
      .map((book) => {
        const normalizedAuthor = String(book.author || "").trim().toLowerCase();
        const categoryId = book.category?._id?.toString?.() || book.category?.toString?.();
        const matchesAuthor = authorMatchSet.has(normalizedAuthor);
        const matchesCategory = categoryMatchSet.has(String(categoryId || ""));

        let score = 0;
        if (matchesAuthor) score += 8;
        if (matchesCategory) score += 6;

        // Match priority for ordering inside Recommend For You:
        // 2 = same author + same category, 1 = one of them, 0 = none.
        const matchLevel = matchesAuthor && matchesCategory ? 2 : matchesAuthor || matchesCategory ? 1 : 0;

        const freshnessScore = Math.max(
          0,
          4 -
            (Date.now() - new Date(book.createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30),
        );

        return {
          ...book,
          __matchLevel: matchLevel,
          __score: score + freshnessScore,
        };
      })
      .sort((a, b) => {
        if (b.__matchLevel !== a.__matchLevel) return b.__matchLevel - a.__matchLevel;
        if (b.__score !== a.__score) return b.__score - a.__score;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .map(({ __matchLevel, __score, ...book }) => book)
      .slice(0, actualLimit);

    if (scoredCandidates.length > 0 && scoredCandidates.length < actualLimit) {
      const candidateIds = scoredCandidates.map((book) => book._id?.toString());
      const fallbackBooks = await Book.find({
        visibility: BOOK_VISIBILITY.PUBLIC,
        _id: {
          $nin: [...cartBookIds, ...candidateIds].filter(Boolean),
        },
      })
        .populate("category", "name")
        .select("-ebookFile")
        .sort({ createdAt: -1 })
        .limit(actualLimit - scoredCandidates.length)
        .lean();

      scoredCandidates.push(...fallbackBooks);
    }

    if (!scoredCandidates.length) {
      return newestFallback("fallback-newest-relaxed", {
        hasRecentlyViewed: false,
        hasCartHistory: cartBookIds.length > 0,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasAuthorInterest: preferredAuthors.length > 0,
        hasCategoryInterest: preferredCategoryIds.length > 0,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
        lastAccessAt: user?.updatedAt || null,
      });
    }

    return {
      books: scoredCandidates,
      strategy: "cart-author-category",
      signals: {
        hasRecentlyViewed: false,
        hasCartHistory: cartBookIds.length > 0,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasAuthorInterest: preferredAuthors.length > 0,
        hasCategoryInterest: preferredCategoryIds.length > 0,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
        lastAccessAt: user?.updatedAt || null,
      },
    };
  }

  // UC-15: Lấy thông tin chi tiết của một cuốn sách
  // Luồng xử lý: Từ BookDetailPage, user click vào sách để xem chi tiết
  // Bắt đầu: Frontend gọi API getBookById với book ID
  // Xử lý chính: Query MongoDB tìm sách theo ID và visibility PUBLIC, populate category
  // Cuối cùng: Trả về thông tin sách đầy đủ, hiển thị trên BookDetailPage
  async getBookById(bookId) {
    // Query tìm sách theo ID và chỉ lấy sách PUBLIC
    const book = await Book.findOne({
      _id: bookId,
      visibility: BOOK_VISIBILITY.PUBLIC,  // Chỉ lấy sách công khai
    })
      .populate("category", "name description")  // Populate thông tin category
      .select("-ebookFile");                      // Loại bỏ ebookFile khỏi kết quả

    // Nếu không tìm thấy sách, throw error
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // Trả về thông tin sách
    return book;
  }

  async checkEbookAccess(userId, bookId) {
    const book = await Book.findById(bookId).select('isEbook').lean();
    if (!book) throw ApiError.notFound(MESSAGES.NOT_FOUND);
    if (!book.isEbook) return { hasAccess: false, paymentStatus: null };

    const paidOrder = await Order.findOne({
      user: userId,
      "items.book": bookId,
      paymentStatus: "PAID",
      orderStatus: { $ne: "CANCELLED" },
      orderKind: { $in: ["DIGITAL", null] },
    }).lean();

    if (paidOrder) return { hasAccess: true, paymentStatus: "PAID" };

    const anyOrder = await Order.findOne({
      user: userId,
      "items.book": bookId,
    })
      .select("paymentStatus orderStatus")
      .sort({ createdAt: -1 })
      .lean();

    return { hasAccess: false, paymentStatus: anyOrder?.paymentStatus || null };
  }

  async getEbookFilePath(userId, bookId) {
    const book = await Book.findById(bookId).select('isEbook ebookFile').lean();
    if (!book) throw ApiError.notFound(MESSAGES.NOT_FOUND);
    if (!book.isEbook || !book.ebookFile) throw ApiError.notFound('E-book not available');

    const access = await this.checkEbookAccess(userId, bookId);
    if (!access.hasAccess) {
      throw ApiError.forbidden('Please complete payment to read this e-book.');
    }

    return book.ebookFile; // e.g. '/uploads/ebooks/xxx.pdf'
  }

  async getEbookReaderState(userId, bookId) {
    const book = await this.requireReadableEbook(userId, bookId);
    const readerState = await EbookReaderState.findOne({
      user: userId,
      book: bookId,
    }).lean();

    return this.buildReaderStatePayload(book, readerState);
  }

  async updateEbookReaderProgress(userId, bookId, payload = {}) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const totalPages =
      Number(book?.ebookMetadata?.totalPages || 0) ||
      this.estimatePdfTotalPages(book?.ebookFile || "");
    const currentPage = Number(payload.currentPage || state.progress?.currentPage || 1);

    if (!Number.isFinite(currentPage) || currentPage < 1) {
      throw ApiError.badRequest("Current page must be greater than 0");
    }

    state.progress.currentPage =
      totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
    state.progress.scrollOffset = Math.max(0, Number(payload.scrollOffset || 0));
    state.progress.completionPercent =
      totalPages > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Number((((state.progress.currentPage || 1) / totalPages) * 100).toFixed(1)),
            ),
          )
        : Number(payload.completionPercent || state.progress?.completionPercent || 0);
    state.progress.lastReadAt = new Date();
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async updateEbookReaderSettings(userId, bookId, payload = {}) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const defaultSettings = this.getDefaultReaderSettings();
    const nextSettings = {
      ...defaultSettings,
      ...(state.settings?.toObject?.() || state.settings || {}),
      ...(payload || {}),
    };

    if (!["light", "dark", "sepia"].includes(nextSettings.theme)) {
      throw ApiError.badRequest("Invalid theme");
    }

    if (!["serif", "sans", "mono"].includes(nextSettings.fontFamily)) {
      throw ApiError.badRequest("Invalid font family");
    }

    state.settings.theme = nextSettings.theme;
    state.settings.fontSize = Math.min(30, Math.max(14, Number(nextSettings.fontSize || defaultSettings.fontSize)));
    state.settings.fontFamily = nextSettings.fontFamily;
    state.settings.lineSpacing = Math.min(2.4, Math.max(1.2, Number(nextSettings.lineSpacing || defaultSettings.lineSpacing)));
    state.settings.zoomPercent = Math.min(180, Math.max(80, Number(nextSettings.zoomPercent || defaultSettings.zoomPercent)));
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async addEbookBookmark(userId, bookId, payload = {}) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const page = Number(payload.page);

    if (!Number.isFinite(page) || page < 1) {
      throw ApiError.badRequest("Bookmark page must be greater than 0");
    }

    const hasLabel = Object.prototype.hasOwnProperty.call(payload, "label");
    const hasSnippet = Object.prototype.hasOwnProperty.call(payload, "snippet");
    const hasNote = Object.prototype.hasOwnProperty.call(payload, "note");
    const defaultLabel = `Page ${page}`;
    const defaultSnippet = `Saved on page ${page}`;
    const existingBookmark = state.bookmarks.find(
      (bookmark) => Number(bookmark.page) === page,
    );

    const nextBookmark = {
      label: hasLabel
        ? String(payload.label || "").trim() || defaultLabel
        : String(existingBookmark?.label || "").trim() || defaultLabel,
      page,
      snippet: hasSnippet
        ? String(payload.snippet || "").trim() || defaultSnippet
        : String(existingBookmark?.snippet || "").trim() || defaultSnippet,
      note: hasNote
        ? String(payload.note || "").trim()
        : String(existingBookmark?.note || "").trim(),
    };

    const remainingBookmarks = state.bookmarks
      .filter((bookmark) => Number(bookmark.page) !== page)
      .map((bookmark) =>
        typeof bookmark.toObject === "function" ? bookmark.toObject() : bookmark,
      );

    state.bookmarks = [nextBookmark, ...remainingBookmarks];
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async deleteEbookBookmark(userId, bookId, bookmarkId) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const bookmark = state.bookmarks.id(bookmarkId);

    if (!bookmark) {
      throw ApiError.notFound("Bookmark not found");
    }

    bookmark.deleteOne();
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async addEbookAnnotation(userId, bookId, payload = {}) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const page = Number(payload.page);

    if (!Number.isFinite(page) || page < 1) {
      throw ApiError.badRequest("Annotation page must be greater than 0");
    }

    state.annotations.unshift({
      page,
      snippet: String(payload.snippet || "").trim(),
      note: String(payload.note || "").trim(),
      color: ["yellow", "mint", "rose", "sky"].includes(payload.color)
        ? payload.color
        : "yellow",
    });
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async updateEbookAnnotation(userId, bookId, annotationId, payload = {}) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const annotation = state.annotations.id(annotationId);

    if (!annotation) {
      throw ApiError.notFound("Annotation not found");
    }

    const page = Number(payload.page || annotation.page);

    if (!Number.isFinite(page) || page < 1) {
      throw ApiError.badRequest("Annotation page must be greater than 0");
    }

    annotation.page = page;
    annotation.snippet = String(payload.snippet || annotation.snippet || "").trim();
    annotation.note = String(payload.note || "").trim();
    annotation.color = ["yellow", "mint", "rose", "sky"].includes(payload.color)
      ? payload.color
      : annotation.color;

    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async deleteEbookAnnotation(userId, bookId, annotationId) {
    const book = await this.requireReadableEbook(userId, bookId);
    const state = await this.findOrCreateReaderState(userId, bookId);
    const annotation = state.annotations.id(annotationId);

    if (!annotation) {
      throw ApiError.notFound("Annotation not found");
    }

    annotation.deleteOne();
    await state.save();

    return this.buildReaderStatePayload(book, state.toObject());
  }

  async getMyEbooks(userId) {
    const orders = await Order.find({
      user: userId,
      orderKind: { $in: ["DIGITAL", null] },
    })
      .populate("items.book")
      .sort({ createdAt: -1 })
      .lean();

    const uniqueByBookId = new Map();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const book = item.book;
        if (!book?._id || !book?.isEbook) return;

        const isAccessible =
          order.paymentStatus === "PAID" && order.orderStatus !== "CANCELLED";
        const existing = uniqueByBookId.get(book._id.toString());
        const candidate = {
          _id: book._id,
          title: book.title || item.title || "Untitled E-Book",
          author: book.author || item.author || "Unknown Author",
          imageUrl: book.imageUrl || "",
          price: Number(book.price || item.price || 0),
          latestOrderAt: order.createdAt,
          latestPaidAt: isAccessible ? order.createdAt : null,
          hasPaidOrder: isAccessible,
          paymentStatus: order.paymentStatus || null,
          orderStatus: order.orderStatus || null,
        };

        if (!existing) {
          uniqueByBookId.set(book._id.toString(), candidate);
          return;
        }

        uniqueByBookId.set(book._id.toString(), {
          ...existing,
          latestOrderAt:
            new Date(candidate.latestOrderAt) > new Date(existing.latestOrderAt)
              ? candidate.latestOrderAt
              : existing.latestOrderAt,
          latestPaidAt:
            candidate.latestPaidAt &&
            (!existing.latestPaidAt ||
              new Date(candidate.latestPaidAt) > new Date(existing.latestPaidAt))
              ? candidate.latestPaidAt
              : existing.latestPaidAt,
          hasPaidOrder: existing.hasPaidOrder || candidate.hasPaidOrder,
          paymentStatus: candidate.paymentStatus || existing.paymentStatus,
          orderStatus: candidate.orderStatus || existing.orderStatus,
        });
      });
    });

    return Array.from(uniqueByBookId.values()).sort(
      (a, b) => new Date(b.latestOrderAt) - new Date(a.latestOrderAt),
    );
  }

  // hàm getAllBooksAdmin lấy danh sách tất cả sách 
  async getAllBooksAdmin(filters = {}) {
    const {
      category,
      visibility,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = filters;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (visibility) {
      query.visibility = visibility;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const actualLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);

    const [books, totalBooks] = await Promise.all([
      Book.find(query)
        .populate("category", "name")
        .skip(skip)
        .limit(actualLimit)
        .sort({ createdAt: -1 })
        .lean(),
      Book.countDocuments(query),
    ]);

    return {
      books,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalBooks / actualLimit),
        totalBooks,
        limit: actualLimit,
      },
    };
  }

  //Tạo sách mới 
  async createBook(bookData) {
    const categoryExists = await Category.findById(bookData.category);
    if (!categoryExists || categoryExists.isDeleted) {
      throw ApiError.badRequest("Invalid category");
    }

    //gọi hàm create để tạo sách mới
    const book = await Book.create(bookData);
    //populate thông tin category sau khi tạo sách
    await book.populate("category", "name");

    return book;
  }

  // Cập nhật thông tin sách (Admin)
  async updateBook(bookId, updateData) {
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists || categoryExists.isDeleted) {
        throw ApiError.badRequest("Invalid category");
      }
    }

    //gọi hàm findByIdAndUpdate để cập nhật thông tin sách
    const book = await Book.findByIdAndUpdate(
      bookId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("category", "name");

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  // Cập nhật trường visibility của sách
  async updateVisibility(bookId, visibility) {
    //gọi hàm findByIdAndUpdate để cập nhật trường visibility của sách
    const book = await Book.findByIdAndUpdate(
      bookId,
      { visibility },
      { new: true, runValidators: true },
    ).populate("category", "name");

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  // Cập nhật toàn bộ mảng previewPages của sách
  async updatePreviewPages(bookId, previewPages = []) {
    // Validate previewPages phải là mảng và có ít nhất 1 trang xem trước
    if (!Array.isArray(previewPages) || previewPages.length === 0) {
      // Nếu không có trang xem trước nào được cung cấp, throw error
      throw ApiError.badRequest("Please upload at least one preview image");
    }

    // Giới hạn tối đa 10 trang xem trước để tránh quá tải
    if (previewPages.length > 10) {
      throw ApiError.badRequest("Preview pages cannot exceed 10 images");
    }

    // Cập nhật trường previewPages của sách với mảng mới
    const book = await Book.findByIdAndUpdate(
      bookId,
      { $set: { previewPages } },
      { new: true, runValidators: true },
    ).populate("category", "name");

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  // Quản lý trang xem trước (Preview page) của sách
  async managePreviewPage(bookId, { operation, pageNumber, previewPageUrl }) {
    // Chuẩn hóa operation và pageNumber để đảm bảo tính nhất quán
    const normalizedOperation = String(operation || "").toLowerCase();
    // Chuyển pageNumber thành số nguyên
    const position = Number(pageNumber);

    // Validate pageNumber phải là số nguyên dương
    if (!Number.isInteger(position) || position < 1) {
      throw ApiError.badRequest("Page number must be a positive integer");
    }

    // Validate operation phải là một trong "insert", "replace", "delete"
    if (!["insert", "replace", "delete"].includes(normalizedOperation)) {
      throw ApiError.badRequest("Invalid preview operation");
    }

    // Tìm sách theo ID
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // Lấy mảng previewPages hiện tại, đảm bảo luôn là mảng
    const currentPages = Array.isArray(book.previewPages)
      ? [...book.previewPages]
      : [];

      // Xử lý theo từng loại operation
    if (normalizedOperation === "insert") {
      // Với insert, previewPageUrl là bắt buộc để biết URL của trang xem trước mới
      if (!previewPageUrl) {
        throw ApiError.badRequest("Preview image is required for insert");
      }
      // Giới hạn tối đa 10 trang xem trước
      if (currentPages.length >= 10) {
        throw ApiError.badRequest(
          "Cannot insert more preview pages. Maximum is 10",
        );
      }
      // Với insert, vị trí hợp lệ là từ 1 đến currentPages.length + 1 (cho phép chèn vào cuối)
      if (position > currentPages.length + 1) {
        throw ApiError.badRequest(
          `Insert page must be between 1 and ${currentPages.length + 1}`,
        );
      }

      // Chèn URL trang xem trước mới vào vị trí mong muốn (position - 1 do mảng bắt đầu từ 0)
      currentPages.splice(position - 1, 0, previewPageUrl);
    }

    // Với replace và delete, vị trí hợp lệ là từ 1 đến currentPages.length (phải có trang để thay thế hoặc xóa)
    if (normalizedOperation === "replace") {
      if (!previewPageUrl) {
        throw ApiError.badRequest("Preview image is required for replace");
      }
      if (currentPages.length === 0) {
        throw ApiError.badRequest("No preview page to replace");
      }
      if (position > currentPages.length) {
        throw ApiError.badRequest(
          `Replace page must be between 1 and ${currentPages.length}`,
        );
      }

      currentPages[position - 1] = previewPageUrl;
    }

    // Với delete, chỉ cần vị trí hợp lệ để xóa trang xem trước hiện tại
    if (normalizedOperation === "delete") {
      if (currentPages.length === 0) {
        throw ApiError.badRequest("No preview page to delete");
      }
      if (position > currentPages.length) {
        throw ApiError.badRequest(
          `Delete page must be between 1 and ${currentPages.length}`,
        );
      }

      currentPages.splice(position - 1, 1);
    }

    book.previewPages = currentPages;
    await book.save();
    await book.populate("category", "name");

    return book;
  }

  //hàm xóa sách
  async deleteBook(bookId) {
    // Tìm và xóa sách theo ID
    const book = await Book.findByIdAndDelete(bookId);

    // Nếu không tìm thấy sách, throw error
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }
  /* =======================================================
    RECENTLY VIEWED
 ======================================================= */
  // Phương thức để lấy danh sách sách đã xem gần đây của người dùng
  async addToRecentlyViewed(userId, bookId) {
    const user = await User.findById(userId);
    if (!user) return;

    // Nếu chưa có mảng thì khởi tạo
    if (!user.recentlyViewed) {
      user.recentlyViewed = [];
    }

    // Remove duplicate
    user.recentlyViewed = user.recentlyViewed.filter(
      (id) => id.toString() !== bookId.toString(),
    );

    // Add to beginning
    user.recentlyViewed.unshift(bookId);

    // Keep max 5
    user.recentlyViewed = user.recentlyViewed.slice(0, 5);

    await user.save();
  }
  // Phương thức để lấy danh sách sách đã xem gần đây của người dùng
  async getRecentlyViewed(userId) {
    const user = await User.findById(userId).populate({
      path: "recentlyViewed",
      populate: {
        path: "category",
        select: "name",
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user.recentlyViewed;
  }
}

export default new BookService();
