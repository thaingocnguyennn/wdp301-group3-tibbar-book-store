import Book from '../models/Book.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES, PAGINATION, BOOK_VISIBILITY } from '../config/constants.js';
import User from '../models/User.js';
class BookService {
  async getPublicBooks(filters = {}) {
    const {
      category,
      author,
      minPrice,
      maxPrice,
      search,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = filters;

    const query = { visibility: BOOK_VISIBILITY.PUBLIC };

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = new RegExp(author, 'i');
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
        .populate('category', 'name')
        .skip(skip)
        .limit(actualLimit)
        .sort({ createdAt: -1 })
        .lean(),
      Book.countDocuments(query)
    ]);

    return {
      books,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalBooks / actualLimit),
        totalBooks,
        limit: actualLimit
      }
    };
  }

  async getNewestBooks(limit = 10) {
    const books = await Book.find({ visibility: BOOK_VISIBILITY.PUBLIC })
      .populate('category', 'name')
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
          orderStatus: 'DELIVERED'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.book',
          soldQuantity: { $sum: '$items.quantity' },
          soldRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { soldQuantity: -1, soldRevenue: -1 } },
      { $limit: actualLimit },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $match: {
          'book.visibility': BOOK_VISIBILITY.PUBLIC
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'book.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $addFields: {
          'book.category': {
            $cond: [
              { $gt: [{ $size: '$category' }, 0] },
              {
                _id: { $arrayElemAt: ['$category._id', 0] },
                name: { $arrayElemAt: ['$category.name', 0] }
              },
              null
            ]
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$book',
              {
                soldQuantity: '$soldQuantity',
                soldRevenue: '$soldRevenue'
              }
            ]
          }
        }
      }
    ]);

    return bestSellers;
  }

  async getBookById(bookId) {
    const book = await Book.findOne({
      _id: bookId,
      visibility: BOOK_VISIBILITY.PUBLIC
    })
      .populate('category', 'name description')
      .select('-ebookFile');

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
      limit = PAGINATION.DEFAULT_LIMIT
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
        .populate('category', 'name')
        .skip(skip)
        .limit(actualLimit)
        .sort({ createdAt: -1 })
        .lean(),
      Book.countDocuments(query)
    ]);

    return {
      books,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalBooks / actualLimit),
        totalBooks,
        limit: actualLimit
      }
    };
  }

  async createBook(bookData) {
    const categoryExists = await Category.findById(bookData.category);
    if (!categoryExists || categoryExists.isDeleted) {
      throw ApiError.badRequest('Invalid category');
    }

    const book = await Book.create(bookData);
    await book.populate('category', 'name');

    return book;
  }

  async updateBook(bookId, updateData) {
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists || categoryExists.isDeleted) {
        throw ApiError.badRequest('Invalid category');
      }
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  async updateVisibility(bookId, visibility) {
    const book = await Book.findByIdAndUpdate(
      bookId,
      { visibility },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

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
      id => id.toString() !== bookId.toString()
    );

    // Add to beginning
    user.recentlyViewed.unshift(bookId);

    // Keep max 5
    user.recentlyViewed = user.recentlyViewed.slice(0, 5);

    await user.save();
  }
  // Phương thức để lấy danh sách sách đã xem gần đây của người dùng
  async getRecentlyViewed(userId) {
    const user = await User.findById(userId)
      .populate({
        path: 'recentlyViewed',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user.recentlyViewed;
  }

}

export default new BookService();