import Book from "../models/Book.js";
import Category from "../models/Category.js";
import Cart from "../models/Cart.js";
// FIX: getBestSellingBooks uses Order.aggregate, so Order model must be imported.
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES, PAGINATION, BOOK_VISIBILITY } from "../config/constants.js";
import User from "../models/User.js";
class BookService {
  async getPublicBooks(filters = {}) {
    const {
      category,
      author,
      minPrice,
      maxPrice,
      search,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = filters;

    const query = { visibility: BOOK_VISIBILITY.PUBLIC };

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = new RegExp(author, "i");
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
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

  async getNewestBooks(limit = 10) {
    const books = await Book.find({ visibility: BOOK_VISIBILITY.PUBLIC })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return books;
  }

  async getBestSellingBooks(limit = 8) {
    const actualLimit = Math.min(Number(limit) || 8, PAGINATION.MAX_LIMIT);

    const bestSellers = await Order.aggregate([
      {
        $match: {
          orderStatus: "DELIVERED",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.book",
          soldQuantity: { $sum: "$items.quantity" },
          soldRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { soldQuantity: -1, soldRevenue: -1 } },
      { $limit: actualLimit },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $match: {
          "book.visibility": BOOK_VISIBILITY.PUBLIC,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "book.category",
          foreignField: "_id",
          as: "category",
        },
      },
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

    return bestSellers;
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
        .sort({ createdAt: -1 })
        .limit(actualLimit)
        .lean();

      return { books, strategy, signals };
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

  async getBookById(bookId) {
    const book = await Book.findOne({
      _id: bookId,
      visibility: BOOK_VISIBILITY.PUBLIC,
    })
      .populate("category", "name description")
      .select("-ebookFile");

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  async checkEbookAccess(userId, bookId) {
    const book = await Book.findById(bookId).select('isEbook').lean();
    if (!book) throw ApiError.notFound(MESSAGES.NOT_FOUND);
    if (!book.isEbook) return { hasAccess: false, paymentStatus: null };

    const paidOrder = await Order.findOne({
      user: userId,
      'items.book': bookId,
      paymentStatus: 'PAID',
    }).lean();

    if (paidOrder) return { hasAccess: true, paymentStatus: 'PAID' };

    const anyOrder = await Order.findOne({
      user: userId,
      'items.book': bookId,
    })
      .select('paymentStatus')
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

  async createBook(bookData) {
    const categoryExists = await Category.findById(bookData.category);
    if (!categoryExists || categoryExists.isDeleted) {
      throw ApiError.badRequest("Invalid category");
    }

    const book = await Book.create(bookData);
    await book.populate("category", "name");

    return book;
  }

  async updateBook(bookId, updateData) {
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists || categoryExists.isDeleted) {
        throw ApiError.badRequest("Invalid category");
      }
    }

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

  async updateVisibility(bookId, visibility) {
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

  async updatePreviewPages(bookId, previewPages = []) {
    if (!Array.isArray(previewPages) || previewPages.length === 0) {
      throw ApiError.badRequest("Please upload at least one preview image");
    }

    if (previewPages.length > 10) {
      throw ApiError.badRequest("Preview pages cannot exceed 10 images");
    }

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

  async managePreviewPage(bookId, { operation, pageNumber, previewPageUrl }) {
    const normalizedOperation = String(operation || "").toLowerCase();
    const position = Number(pageNumber);

    if (!Number.isInteger(position) || position < 1) {
      throw ApiError.badRequest("Page number must be a positive integer");
    }

    if (!["insert", "replace", "delete"].includes(normalizedOperation)) {
      throw ApiError.badRequest("Invalid preview operation");
    }

    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    const currentPages = Array.isArray(book.previewPages)
      ? [...book.previewPages]
      : [];

    if (normalizedOperation === "insert") {
      if (!previewPageUrl) {
        throw ApiError.badRequest("Preview image is required for insert");
      }
      if (currentPages.length >= 10) {
        throw ApiError.badRequest(
          "Cannot insert more preview pages. Maximum is 10",
        );
      }
      if (position > currentPages.length + 1) {
        throw ApiError.badRequest(
          `Insert page must be between 1 and ${currentPages.length + 1}`,
        );
      }

      currentPages.splice(position - 1, 0, previewPageUrl);
    }

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

  async deleteBook(bookId) {
    const book = await Book.findByIdAndDelete(bookId);

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
