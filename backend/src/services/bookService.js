import Book from "../models/Book.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
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
    const actualLimit = Math.min(
      Number(options.limit) || 8,
      PAGINATION.MAX_LIMIT,
    );
    const searchTerms = Array.isArray(options.searchTerms)
      ? options.searchTerms
          .filter(Boolean)
          .map((term) => String(term).trim().toLowerCase())
      : [];

    const newestFallback = async (
      strategy = "fallback-newest",
      signals = {},
    ) => {
      const books = await Book.find({ visibility: BOOK_VISIBILITY.PUBLIC })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(actualLimit)
        .lean();

      return {
        books,
        strategy,
        signals,
      };
    };

    if (!userId) {
      return newestFallback("fallback-newest", {
        hasRecentlyViewed: false,
        hasSearchHistory: searchTerms.length > 0,
        hasCartHistory: false,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasCategoryInterest: false,
        hasFavoriteBrand: false,
        hasPricePreference: false,
        hasSimilarUsers: false,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
      });
    }

    const [user, recentOrders, cart, wishlist] = await Promise.all([
      User.findById(userId).select("recentlyViewed addresses updatedAt").lean(),
      Order.find({ user: userId, orderStatus: { $ne: "CANCELLED" } })
        .select("items.book items.quantity items.price orderStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      Cart.findOne({ user: userId })
        .select("items.book items.quantity updatedAt")
        .lean(),
      Wishlist.findOne({ user: userId }).select("books updatedAt").lean(),
    ]);

    const recentlyViewedIds = Array.isArray(user?.recentlyViewed)
      ? user.recentlyViewed.map((id) => id.toString())
      : [];
    const cartBookIds = Array.isArray(cart?.items)
      ? cart.items.map((item) => item.book?.toString()).filter(Boolean)
      : [];
    const wishlistBookIds = Array.isArray(wishlist?.books)
      ? wishlist.books.map((id) => id.toString())
      : [];

    const purchasedBookCounter = new Map();
    for (const order of recentOrders) {
      for (const item of order.items || []) {
        if (!item.book) continue;
        const key = item.book.toString();
        const multiplier = order.orderStatus === "DELIVERED" ? 1.3 : 1;
        const quantity = Number(item.quantity) || 1;
        purchasedBookCounter.set(
          key,
          (purchasedBookCounter.get(key) || 0) + quantity * multiplier,
        );
      }
    }

    const purchasedBookIds = [...purchasedBookCounter.keys()];
    const signalBookIds = [
      ...new Set([
        ...recentlyViewedIds,
        ...cartBookIds,
        ...wishlistBookIds,
        ...purchasedBookIds,
      ]),
    ];

    if (!signalBookIds.length && !searchTerms.length) {
      return newestFallback("fallback-newest", {
        hasRecentlyViewed: false,
        hasSearchHistory: false,
        hasCartHistory: false,
        hasPurchaseHistory: false,
        hasWishlist: false,
        hasCategoryInterest: false,
        hasFavoriteBrand: false,
        hasPricePreference: false,
        hasSimilarUsers: false,
        language: options.language || null,
        platform: options.platform || null,
        location: options.location || null,
      });
    }

    const signalBooks = signalBookIds.length
      ? await Book.find({
          _id: { $in: signalBookIds },
          visibility: BOOK_VISIBILITY.PUBLIC,
        })
          .select("category author price")
          .lean()
      : [];

    const categoryScores = new Map();
    const authorScores = new Map();
    const observedPrices = [];

    for (const book of signalBooks) {
      const bookId = book._id.toString();
      const categoryId = book.category?.toString();
      const normalizedAuthor = (book.author || "").trim().toLowerCase();

      let totalWeight = 0;
      if (recentlyViewedIds.includes(bookId)) totalWeight += 5;
      if (cartBookIds.includes(bookId)) totalWeight += 6;
      if (wishlistBookIds.includes(bookId)) totalWeight += 7;
      totalWeight += (purchasedBookCounter.get(bookId) || 0) * 4;

      if (categoryId && totalWeight > 0) {
        categoryScores.set(
          categoryId,
          (categoryScores.get(categoryId) || 0) + totalWeight,
        );
      }

      if (normalizedAuthor && totalWeight > 0) {
        authorScores.set(
          normalizedAuthor,
          (authorScores.get(normalizedAuthor) || 0) + totalWeight,
        );
      }

      if (book.price && totalWeight > 0) {
        const copies = Math.max(1, Math.round(totalWeight / 4));
        for (let i = 0; i < copies; i += 1) {
          observedPrices.push(Number(book.price));
        }
      }
    }

    const preferredCategoryIds = [...categoryScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([categoryId]) => categoryId);

    const preferredAuthors = [...authorScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([author]) => author);

    const preferredPriceMin = observedPrices.length
      ? Math.max(0, Math.min(...observedPrices) * 0.8)
      : null;
    const preferredPriceMax = observedPrices.length
      ? Math.max(...observedPrices) * 1.2
      : null;

    const similarUserBookScores = new Map();
    if (preferredCategoryIds.length) {
      const topCategories = preferredCategoryIds.slice(0, 3);

      const similarUsers = await Order.aggregate([
        { $match: { orderStatus: "DELIVERED", user: { $ne: user._id } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "books",
            localField: "items.book",
            foreignField: "_id",
            as: "book",
          },
        },
        { $unwind: "$book" },
        {
          $match: {
            "book.visibility": BOOK_VISIBILITY.PUBLIC,
            "book.category": { $in: topCategories },
          },
        },
        {
          $group: {
            _id: "$user",
            overlapScore: { $sum: "$items.quantity" },
          },
        },
        { $sort: { overlapScore: -1 } },
        { $limit: 10 },
      ]);

      const similarUserIds = similarUsers
        .map((item) => item._id)
        .filter(Boolean);

      if (similarUserIds.length) {
        const similarUserOrders = await Order.aggregate([
          {
            $match: { orderStatus: "DELIVERED", user: { $in: similarUserIds } },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.book",
              score: { $sum: "$items.quantity" },
            },
          },
          { $sort: { score: -1 } },
          { $limit: 120 },
        ]);

        for (const item of similarUserOrders) {
          if (!item?._id) continue;
          similarUserBookScores.set(
            item._id.toString(),
            Number(item.score) || 0,
          );
        }
      }
    }

    const excludeIds = [...new Set(signalBookIds)];

    const matchConditions = [];
    if (preferredCategoryIds.length) {
      matchConditions.push({ category: { $in: preferredCategoryIds } });
    }

    if (preferredAuthors.length) {
      const authorRegex = preferredAuthors.map(
        (author) =>
          new RegExp(`^${author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      );
      matchConditions.push({ author: { $in: authorRegex } });
    }

    if (preferredPriceMin !== null && preferredPriceMax !== null) {
      matchConditions.push({
        price: { $gte: preferredPriceMin, $lte: preferredPriceMax },
      });
    }

    if (searchTerms.length) {
      for (const term of searchTerms.slice(0, 5)) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        matchConditions.push({ title: { $regex: escaped, $options: "i" } });
        matchConditions.push({ author: { $regex: escaped, $options: "i" } });
        matchConditions.push({
          description: { $regex: escaped, $options: "i" },
        });
      }
    }

    let candidates = [];
    if (matchConditions.length) {
      candidates = await Book.find({
        visibility: BOOK_VISIBILITY.PUBLIC,
        _id: { $nin: excludeIds },
        $or: matchConditions,
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(actualLimit * 6)
        .lean();
    }

    const scoredCandidates = candidates
      .map((book) => {
        const bookId = book._id.toString();
        const categoryId = book.category?._id?.toString();
        const normalizedAuthor = (book.author || "").trim().toLowerCase();

        const categoryScore = categoryId
          ? (categoryScores.get(categoryId) || 0) * 3
          : 0;
        const authorScore = normalizedAuthor
          ? (authorScores.get(normalizedAuthor) || 0) * 2
          : 0;

        let priceScore = 0;
        if (preferredPriceMin !== null && preferredPriceMax !== null) {
          if (
            book.price >= preferredPriceMin &&
            book.price <= preferredPriceMax
          ) {
            priceScore = 8;
          } else {
            const midpoint = (preferredPriceMin + preferredPriceMax) / 2;
            const distance = Math.abs(book.price - midpoint);
            priceScore = Math.max(0, 6 - distance / 50000);
          }
        }

        let searchScore = 0;
        if (searchTerms.length) {
          const fullText =
            `${book.title || ""} ${book.author || ""} ${book.description || ""}`.toLowerCase();
          searchScore = searchTerms.reduce(
            (sum, term) => (fullText.includes(term) ? sum + 4 : sum),
            0,
          );
        }

        const similarUserScore = (similarUserBookScores.get(bookId) || 0) * 2;
        const freshnessScore = Math.max(
          0,
          5 -
            (Date.now() - new Date(book.createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30),
        );

        return {
          ...book,
          __score:
            categoryScore +
            authorScore +
            priceScore +
            searchScore +
            similarUserScore +
            freshnessScore,
        };
      })
      .sort((a, b) => {
        if (b.__score !== a.__score) return b.__score - a.__score;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .map(({ __score, ...book }) => book);

    if (scoredCandidates.length < actualLimit) {
      const candidateIds = scoredCandidates.map((book) => book._id);
      const fallbackBooks = await Book.find({
        visibility: BOOK_VISIBILITY.PUBLIC,
        _id: { $nin: [...excludeIds, ...candidateIds] },
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(actualLimit - scoredCandidates.length)
        .lean();

      scoredCandidates.push(...fallbackBooks);
    }

    return {
      books: scoredCandidates.slice(0, actualLimit),
      strategy: "multi-signal-personalization",
      signals: {
        hasRecentlyViewed: recentlyViewedIds.length > 0,
        hasSearchHistory: searchTerms.length > 0,
        hasCartHistory: cartBookIds.length > 0,
        hasPurchaseHistory: purchasedBookIds.length > 0,
        hasWishlist: wishlistBookIds.length > 0,
        hasCategoryInterest: preferredCategoryIds.length > 0,
        hasFavoriteBrand: preferredAuthors.length > 0,
        hasPricePreference: observedPrices.length > 0,
        hasSimilarUsers: similarUserBookScores.size > 0,
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
