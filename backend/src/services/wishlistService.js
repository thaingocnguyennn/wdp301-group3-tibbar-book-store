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
  async getWishlistStats() { // Thống kê sách được thêm vào wishlist nhiều nhất
    const stats = await Wishlist.aggregate([ // Sử dụng aggregation để đếm số lần mỗi sách xuất hiện trong wishlist
      { $unwind: "$books" }, // "Mở rộng" mảng books thành nhiều document, mỗi document chứa 1 bookId
      {
        $group: { // Nhóm theo bookId và đếm số lần xuất hiện
          _id: "$books", // bookId
          count: { $sum: 1 }// Đếm số lần xuất hiện của mỗi bookId trong wishlist
        }
      },
      {
        $lookup: { // Join với collection "books" để lấy thông tin sách
          from: "books", // Tên collection "books" trong MongoDB
          localField: "_id", // _id ở đây chính là bookId sau khi unwind
          foreignField: "_id",// _id của collection books
          as: "book" // Kết quả join sẽ được lưu trong trường "book" dưới dạng mảng (vì có thể join nhiều document, nhưng ở đây chỉ có 1 document duy nhất)
        }
      },
      { $unwind: "$book" },// Mở rộng trường "book" để lấy thông tin sách ra ngoài
      {
        $project: {// Chọn trường để trả về, loại bỏ _id gốc và chỉ lấy thông tin cần thiết
          _id: 0,// Không trả về _id gốc (bookId)
          bookId: "$book._id",// Trả về bookId để dễ dàng nhận biết
          title: "$book.title",// Trả về title của sách
          author: "$book.author",// Trả về author của sách
          count: 1//  Trả về count để biết số lần sách này xuất hiện trong wishlist, giúp thống kê được sách nào được yêu thích nhất
        }
      },
      { $sort: { count: -1 } }// Sắp xếp theo count giảm dần để sách được thêm vào wishlist nhiều nhất sẽ đứng đầu
    ]);

    return stats;// Trả về kết quả thống kê, mỗi phần tử trong mảng sẽ chứa thông tin sách và số lần nó xuất hiện trong wishlist của người dùng
  }

}

export default new WishlistService();
