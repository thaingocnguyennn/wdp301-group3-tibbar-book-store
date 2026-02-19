import Book from '../models/Book.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES, PAGINATION, BOOK_VISIBILITY, BOOK_PRICE } from '../config/constants.js';

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

    // Validate book price
    if (bookData.price !== undefined && bookData.price !== null) {
      const price = Number(bookData.price);
      if (price < BOOK_PRICE.MIN || price > BOOK_PRICE.MAX) {
        throw ApiError.badRequest(
          `Book price must be between ${BOOK_PRICE.MIN.toLocaleString('vi-VN')} and ${BOOK_PRICE.MAX.toLocaleString('vi-VN')} VND.`
        );
      }
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

    // Validate book price if being updated
    if (updateData.price !== undefined && updateData.price !== null) {
      const price = Number(updateData.price);
      if (price < BOOK_PRICE.MIN || price > BOOK_PRICE.MAX) {
        throw ApiError.badRequest(
          `Book price must be between ${BOOK_PRICE.MIN.toLocaleString('vi-VN')} and ${BOOK_PRICE.MAX.toLocaleString('vi-VN')} VND.`
        );
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
}

export default new BookService();