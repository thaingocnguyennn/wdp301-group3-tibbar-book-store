import Wishlist from '../models/Wishlist.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

class WishlistService {
  async getWishlist(userId) {
    const wishlist = await Wishlist
      .findOne({ user: userId })
      .populate('books');

    return wishlist || { books: [] };
  }

  async addToWishlist(userId, bookId) {
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new ApiError(400, 'Invalid book id');
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { books: bookId } }, //CHỐNG TRÙNG TUYỆT ĐỐI
      { new: true, upsert: true }
    ).populate('books');

    return wishlist;
  }


  async removeFromWishlist(userId, bookId) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return [];

    wishlist.books = wishlist.books.filter(
      id => id.toString() !== bookId
    );
    await wishlist.save();
    await wishlist.populate('books');
    return wishlist;

  }
  async getWishlistStats() {
    const stats = await Wishlist.aggregate([
      { $unwind: "$books" },
      {
        $group: {
          _id: "$books",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book"
        }
      },
      { $unwind: "$book" },
      {
        $project: {
          _id: 0,
          bookId: "$book._id",
          title: "$book.title",
          author: "$book.author",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    return stats;
  }

}

export default new WishlistService();
