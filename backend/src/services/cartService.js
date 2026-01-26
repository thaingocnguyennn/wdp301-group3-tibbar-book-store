import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, BOOK_VISIBILITY } from "../config/constants.js";

/**
 * CartService - Xử lý business logic cho Cart Management
 *
 * CLEAN CODE PRINCIPLES:
 * ✅ Single Responsibility: Mỗi method xử lý 1 chức năng cụ thể
 * ✅ Error Handling: Validate đầy đủ trước khi thao tác
 * ✅ Separation of Concerns: Service chỉ lo business logic, Model lo database
 * ✅ Readable & Maintainable: Code dễ đọc, dễ mở rộng
 *
 * FLOW XỬ LÝ CART:
 * 1. User thêm/sửa/xóa item -> Controller nhận request
 * 2. Controller gọi CartService với userId
 * 3. CartService validate (book tồn tại? còn hàng? visibility?)
 * 4. CartService xử lý logic và lưu vào database
 * 5. Trả về cart đã cập nhật cho client
 */
class CartService {
  /**
   * Lấy giỏ hàng của user
   * Nếu chưa có cart -> tự động tạo mới
   *
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} Cart với đầy đủ thông tin sách
   */
  async getCart(userId) {
    try {
      const cart = await Cart.getOrCreateCart(userId);

      // Filter out items with invalid books (deleted or hidden)
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(
        (item) => item.book && item.book.visibility === BOOK_VISIBILITY.PUBLIC,
      );

      // Nếu có items bị filter -> save lại cart
      if (cart.items.length !== originalLength) {
        await cart.save();
      }

      return cart;
    } catch (error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to fetch cart",
      );
    }
  }

  /**
   * Thêm sách vào giỏ hàng
   *
   * VALIDATION:
   * - Book phải tồn tại và có visibility = PUBLIC
   * - Quantity phải > 0
   * - Stock phải đủ (quantity <= book.stock)
   *
   * LOGIC:
   * - Nếu sách đã có trong cart -> cộng thêm quantity
   * - Nếu chưa có -> thêm mới
   *
   * @param {string} userId - ID của user
   * @param {string} bookId - ID của sách cần thêm
   * @param {number} quantity - Số lượng muốn thêm (default: 1)
   * @returns {Promise<Object>} Cart sau khi thêm
   */
  async addToCart(userId, bookId, quantity = 1) {
    // Step 1: Validate quantity
    if (quantity <= 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Quantity must be greater than 0",
      );
    }

    // Step 2: Validate book
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Book not found");
    }

    // Check visibility
    if (book.visibility !== BOOK_VISIBILITY.PUBLIC) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This book is not available");
    }

    // Step 3: Get or create cart
    const cart = await Cart.getOrCreateCart(userId);

    // Step 4: Check stock availability
    const existingItem = cart.items.find(
      (item) => item.book._id.toString() === bookId.toString(),
    );
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentQuantityInCart + quantity;

    if (totalQuantity > book.stock) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Only ${book.stock} items available in stock`,
      );
    }

    // Step 5: Add to cart
    await cart.addItem(bookId, quantity, book.price);

    // Step 6: Refresh cart with populated data
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.book",
      select: "title author price imageUrl stock visibility",
    });

    return updatedCart;
  }

  /**
   * Cập nhật số lượng của một item trong cart
   *
   * @param {string} userId - ID của user
   * @param {string} bookId - ID của sách cần update
   * @param {number} quantity - Số lượng mới
   * @returns {Promise<Object>} Cart sau khi update
   */
  async updateCartItem(userId, bookId, quantity) {
    // Step 1: Validate quantity
    if (quantity < 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Quantity cannot be negative",
      );
    }

    // Step 2: Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");
    }

    // Step 3: Check if item exists in cart
    const item = cart.items.find(
      (item) => item.book.toString() === bookId.toString(),
    );

    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");
    }

    // Step 4: If quantity = 0 -> remove item
    if (quantity === 0) {
      return this.removeFromCart(userId, bookId);
    }

    // Step 5: Validate stock
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Book not found");
    }

    if (quantity > book.stock) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Only ${book.stock} items available in stock`,
      );
    }

    // Step 6: Update quantity
    await cart.updateItemQuantity(bookId, quantity);

    // Step 7: Refresh cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.book",
      select: "title author price imageUrl stock visibility",
    });

    return updatedCart;
  }

  /**
   * Xóa item khỏi giỏ hàng
   *
   * @param {string} userId - ID của user
   * @param {string} bookId - ID của sách cần xóa
   * @returns {Promise<Object>} Cart sau khi xóa
   */
  async removeFromCart(userId, bookId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");
    }

    await cart.removeItem(bookId);

    // Refresh cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.book",
      select: "title author price imageUrl stock visibility",
    });

    return updatedCart;
  }

  /**
   * Xóa toàn bộ giỏ hàng
   * Dùng sau khi checkout thành công
   *
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} Cart rỗng
   */
  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");
    }

    await cart.clearCart();

    return cart;
  }

  /**
   * Validate cart trước khi checkout
   * Kiểm tra:
   * - Tất cả sách còn tồn tại và visibility = PUBLIC
   * - Stock đủ cho từng item
   *
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} Kết quả validation và warnings
   */
  async validateCartStock(userId) {
    const cart = await Cart.getOrCreateCart(userId);

    if (cart.items.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Cart is empty");
    }

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate từng item
    for (const item of cart.items) {
      const book = await Book.findById(item.book._id);

      // Check book exists
      if (!book) {
        validationResults.isValid = false;
        validationResults.errors.push({
          bookId: item.book._id,
          message: "Book no longer exists",
        });
        continue;
      }

      // Check visibility
      if (book.visibility !== BOOK_VISIBILITY.PUBLIC) {
        validationResults.isValid = false;
        validationResults.errors.push({
          bookId: book._id,
          title: book.title,
          message: "Book is no longer available",
        });
        continue;
      }

      // Check stock
      if (item.quantity > book.stock) {
        validationResults.isValid = false;
        validationResults.errors.push({
          bookId: book._id,
          title: book.title,
          requestedQuantity: item.quantity,
          availableStock: book.stock,
          message: `Only ${book.stock} items available`,
        });
        continue;
      }

      // Check price change (warning only)
      if (item.priceAtAdd !== book.price) {
        validationResults.warnings.push({
          bookId: book._id,
          title: book.title,
          oldPrice: item.priceAtAdd,
          newPrice: book.price,
          message: "Price has changed since added to cart",
        });
      }
    }

    return validationResults;
  }
}

// Export singleton instance
export default new CartService();
