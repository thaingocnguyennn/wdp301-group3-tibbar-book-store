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
    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    if (!book.isEbook && book.stock < quantity) {
      throw ApiError.badRequest("Not enough stock");
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    await cart.populate("items.book");
    this.ensureCartKindCompatibility(cart.items, book);

    const existingItem = cart.items.find(
      (item) =>
        item.book?._id?.toString?.() === bookId ||
        item.book?.toString?.() === bookId,
    );

    if (book.isEbook) {
      if (existingItem) {
        existingItem.quantity = 1;
      } else {
        cart.items.push({ book: bookId, quantity: 1 });
      }

      await cart.save();
      await cart.populate("items.book");

      return cart;
    }

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > book.stock) {
      throw ApiError.badRequest("Not enough stock");
    }

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
    if (quantity <= 0) {
      return this.removeItem(userId, bookId);
    }

    const book = await Book.findById(bookId);
    if (!book) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    if (!book.isEbook && book.stock < quantity) {
      throw ApiError.badRequest("Not enough stock");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const item = cart.items.find((i) => i.book.toString() === bookId);
    if (!item) {
      throw ApiError.notFound("Cart item not found");
    }

    item.quantity = book.isEbook ? 1 : quantity;

    await cart.save();
    await cart.populate("items.book");

    return cart;
  }

  async removeItem(userId, bookId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return { user: userId, items: [] };
    }

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
