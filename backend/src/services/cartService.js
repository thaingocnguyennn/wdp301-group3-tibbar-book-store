import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES } from "../config/constants.js";

class CartService {
  ensureCartKindCompatibility(cartItems = [], targetBook) {
    if (!targetBook) {
      return;
    }

    const hasEbook = cartItems.some((item) => item.book?.isEbook);
    const hasPhysical = cartItems.some((item) => item.book && !item.book?.isEbook);

    if (
      (targetBook.isEbook && hasPhysical) ||
      (!targetBook.isEbook && hasEbook)
    ) {
      throw ApiError.badRequest(
        "You cannot mix e-books and physical books in the same cart. Please place them in separate orders.",
      );
    }
  }

  async getCart(userId) {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.book")
      .lean();

    return cart || { user: userId, items: [] };
  }

  async addToCart(userId, bookId, quantity = 1) {
    // UC-27: Logic thật sự của Add to Cart nằm ở service này.
    // Kiểm tra sách tồn tại, kiểm tra tồn kho, rồi cập nhật giỏ hàng của user.
    // B1: Tìm sách theo bookId.
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // B2: Sách giấy phải kiểm tra tồn kho trước khi thêm.
    if (!book.isEbook && book.stock < quantity) {
      throw ApiError.badRequest("Not enough stock");
    }

    // B3: Lấy giỏ hàng hiện tại; nếu chưa có thì tạo mới.
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    await cart.populate("items.book");
    // Không cho trộn ebook và sách giấy trong cùng một giỏ.
    this.ensureCartKindCompatibility(cart.items, book);

    // B4: Kiểm tra sách đã tồn tại trong giỏ chưa.
    const existingItem = cart.items.find(
      (item) =>
        item.book?._id?.toString?.() === bookId ||
        item.book?.toString?.() === bookId,
    );

    // B5a: Luồng ebook - luôn giữ quantity = 1.
    if (book.isEbook) {
      if (existingItem) {
        existingItem.quantity = 1;
      } else {
        cart.items.push({ book: bookId, quantity: 1 });
      }

      // Lưu và populate lại để trả về dữ liệu đầy đủ cho frontend.
      await cart.save();
      await cart.populate("items.book");

      return cart;
    }

    // B5b: Luồng sách giấy - cộng dồn số lượng với item cũ (nếu có).
    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    // B6: Chặn trường hợp số lượng mới vượt tồn kho.
    if (newQuantity > book.stock) {
      throw ApiError.badRequest("Not enough stock");
    }

    // B7: Cập nhật item hiện có hoặc thêm item mới.
    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({ book: bookId, quantity: newQuantity });
    }

    await cart.save();
    await cart.populate("items.book");

    return cart;
  }

  async updateItem(userId, bookId, quantity) {
    // UC-28: Logic cập nhật số lượng item trong giỏ nằm ở đây.
    // Nếu quantity <= 0 thì chuyển sang luồng xóa item.
    if (quantity <= 0) {
      return this.removeItem(userId, bookId);
    }

    // B1: Kiểm tra sách còn tồn tại.
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    // B2: Với sách giấy, quantity mới không được vượt quá tồn kho.
    if (!book.isEbook && book.stock < quantity) {
      throw ApiError.badRequest("Not enough stock");
    }

    // B3: Lấy cart của user và tìm item cần cập nhật.
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const item = cart.items.find((i) => i.book.toString() === bookId);
    if (!item) {
      throw ApiError.notFound("Cart item not found");
    }

    // Ebook luôn cố định số lượng = 1, sách giấy nhận quantity người dùng nhập.
    item.quantity = book.isEbook ? 1 : quantity;

    await cart.save();
    await cart.populate("items.book");

    return cart;
  }

  async removeItem(userId, bookId) {
    // UC-28: Logic xóa item khỏi giỏ hàng nằm ở đây.
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return { user: userId, items: [] };
    }

    // Loại item có bookId tương ứng ra khỏi mảng items.
    cart.items = cart.items.filter((item) => item.book.toString() !== bookId);
    await cart.save();
    await cart.populate("items.book");

    return cart;
  }

  async validateStock(userId) {
    const cart = await Cart.findOne({ user: userId }).populate("items.book");

    if (!cart) {
      return { cart: { user: userId, items: [] }, invalidItems: [] };
    }

    const hasEbook = cart.items.some((item) => item.book?.isEbook);
    const hasPhysical = cart.items.some((item) => item.book && !item.book?.isEbook);

    if (hasEbook && hasPhysical) {
      return {
        cart,
        invalidItems: [
          {
            message:
              "You cannot mix e-books and physical books in the same cart. Please separate your order.",
          },
        ],
      };
    }

    const invalidItems = cart.items
      .filter(
        (item) =>
          item.book &&
          !item.book.isEbook &&
          item.quantity > item.book.stock,
      )
      .map((item) => ({
        bookId: item.book._id,
        title: item.book.title,
        requested: item.quantity,
        available: item.book.stock,
      }));

    return { cart, invalidItems };
  }
}

export default new CartService();
