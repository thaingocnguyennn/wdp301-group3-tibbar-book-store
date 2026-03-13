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
    }).populate('category', 'name description');

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
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

  async updatePreviewPages(bookId, previewPages = []) {
    if (!Array.isArray(previewPages) || previewPages.length === 0) {
      throw ApiError.badRequest('Please upload at least one preview image');
    }

    if (previewPages.length > 10) {
      throw ApiError.badRequest('Preview pages cannot exceed 10 images');
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      { $set: { previewPages } },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return book;
  }

  async managePreviewPage(bookId, { operation, pageNumber, previewPageUrl }) {
    const normalizedOperation = String(operation || '').toLowerCase();
    const position = Number(pageNumber);

    if (!Number.isInteger(position) || position < 1) {
      throw ApiError.badRequest('Page number must be a positive integer');
    }

    if (!['insert', 'replace', 'delete'].includes(normalizedOperation)) {
      throw ApiError.badRequest('Invalid preview operation');
    }

    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    const currentPages = Array.isArray(book.previewPages) ? [...book.previewPages] : [];

    if (normalizedOperation === 'insert') {
      if (!previewPageUrl) {
        throw ApiError.badRequest('Preview image is required for insert');
      }
      if (currentPages.length >= 10) {
        throw ApiError.badRequest('Cannot insert more preview pages. Maximum is 10');
      }
      if (position > currentPages.length + 1) {
        throw ApiError.badRequest(`Insert page must be between 1 and ${currentPages.length + 1}`);
      }

      currentPages.splice(position - 1, 0, previewPageUrl);
    }

    if (normalizedOperation === 'replace') {
      if (!previewPageUrl) {
        throw ApiError.badRequest('Preview image is required for replace');
      }
      if (currentPages.length === 0) {
        throw ApiError.badRequest('No preview page to replace');
      }
      if (position > currentPages.length) {
        throw ApiError.badRequest(`Replace page must be between 1 and ${currentPages.length}`);
      }

      currentPages[position - 1] = previewPageUrl;
    }

    if (normalizedOperation === 'delete') {
      if (currentPages.length === 0) {
        throw ApiError.badRequest('No preview page to delete');
      }
      if (position > currentPages.length) {
        throw ApiError.badRequest(`Delete page must be between 1 and ${currentPages.length}`);
      }

      currentPages.splice(position - 1, 1);
    }

    book.previewPages = currentPages;
    await book.save();
    await book.populate('category', 'name');

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