import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Review from '../models/Review.js';
import BackStockSubscription from '../models/BackStockSubscription.js';
import { BOOK_VISIBILITY } from '../config/constants.js';

// GET /api/book-features/low-stock?threshold=5
export const getLowStockBooks = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold || process.env.LOW_STOCK_THRESHOLD || 5);

    const books = await Book.find({
      stock: { $lte: threshold },
      visibility: BOOK_VISIBILITY.PUBLIC
    })
      .select('_id title author price stock imageUrl updatedAt')
      .sort({ stock: 1, updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      threshold,
      count: books.length,
      data: books
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/book-features/back-stock/subscribe
export const subscribeBackStockAlert = async (req, res, next) => {
  try {
    const { bookId, email } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: 'bookId không hợp lệ' });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    const book = await Book.findById(bookId).select('_id stock').lean();
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Nếu sách còn hàng thì không cần đăng ký
    if (book.stock > 0) {
      return res.json({ success: true, alreadyInStock: true, message: 'Sách đang còn hàng' });
    }

    await BackStockSubscription.findOneAndUpdate(
      { book: bookId, email: email.toLowerCase() },
      { $set: { isActive: true, notifiedAt: null } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Đăng ký thông báo thành công' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.json({ success: true, message: 'Email đã đăng ký trước đó' });
    }
    return next(error);
  }
};

// GET /api/book-features/back-stock/ready?email=a@b.com
// Dùng để FE lấy danh sách sách đã có hàng lại cho email này
export const getReadyBackStockAlerts = async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email là bắt buộc' });
    }

    const rows = await BackStockSubscription.aggregate([
      { $match: { email, isActive: true } },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      { $match: { 'book.stock': { $gt: 0 } } },
      {
        $project: {
          _id: 1,
          email: 1,
          createdAt: 1,
          book: {
            _id: '$book._id',
            title: '$book.title',
            author: '$book.author',
            price: '$book.price',
            stock: '$book.stock',
            imageUrl: '$book.imageUrl'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return next(error);
  }
};

// GET /api/book-features/compare?ids=id1,id2,id3
export const compareBooks = async (req, res, next) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (ids.length < 2) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 2 book ids hợp lệ' });
    }

    const books = await Book.find({ _id: { $in: ids } })
      .select('_id title author price stock imageUrl')
      .lean();

    const bookObjectIds = books.map((b) => b._id);

    // Hỗ trợ cả schema review có field "book" hoặc "bookId"
    const ratings = await Review.aggregate([
      {
        $match: {
          $or: [
            { book: { $in: bookObjectIds } },
            { bookId: { $in: bookObjectIds } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$book', '$bookId'] },
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const ratingMap = new Map(ratings.map((r) => [String(r._id), r]));

    const data = books.map((b) => {
      const r = ratingMap.get(String(b._id));
      return {
        ...b,
        avgRating: r ? Number(r.avgRating.toFixed(1)) : 0,
        totalReviews: r?.totalReviews || 0
      };
    });

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};