import Wishlist from '../models/Wishlist.js';
import Book from '../models/Book.js';
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
      { $addToSet: { books: bookId } }, // ✅ CHỐNG TRÙNG TUYỆT ĐỐI
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
}

export default new WishlistService();
