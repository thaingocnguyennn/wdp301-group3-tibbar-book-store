import mongoose from "mongoose";

/**
 * Cart Model - Quản lý giỏ hàng của người dùng
 *
 * Schema này định nghĩa cấu trúc dữ liệu cho giỏ hàng:
 * - Mỗi user chỉ có 1 cart duy nhất (userId unique)
 * - items: mảng chứa các sản phẩm trong giỏ
 * - Mỗi item bao gồm: bookId, quantity, price snapshot
 * - Tự động tính tổng tiền
 */
const cartItemSchema = new mongoose.Schema(
  {
    // Sách trong giỏ hàng
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    // Số lượng
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },

    // Giá tại thời điểm thêm vào giỏ (snapshot để tránh thay đổi giá ảnh hưởng)
    priceAtAdd: {
      type: Number,
      required: true,
    },

    // Thời gian thêm vào giỏ
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
); // Không cần _id cho subdocument

const cartSchema = new mongoose.Schema(
  {
    // User sở hữu giỏ hàng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có 1 cart
    },

    // Danh sách sản phẩm trong giỏ
    items: [cartItemSchema],

    // Tổng giá trị giỏ hàng (tự động tính)
    totalPrice: {
      type: Number,
      default: 0,
    },

    // Tổng số lượng sản phẩm
    totalItems: {
      type: Number,
      default: 0,
    },

    // Thời gian cập nhật cuối
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index để tối ưu query
cartSchema.index({ user: 1 }); // Index cho việc tìm cart theo user
cartSchema.index({ "items.book": 1 }); // Index cho việc tìm sách trong cart

/**
 * Pre-save middleware: Tự động tính tổng giá và số lượng items
 * Chạy mỗi khi cart được save
 */
cartSchema.pre("save", function (next) {
  // Tính tổng giá trị
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.priceAtAdd * item.quantity;
  }, 0);

  // Tính tổng số lượng items
  this.totalItems = this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  // Cập nhật thời gian
  this.lastModified = new Date();

  next();
});

/**
 * Instance method: Thêm hoặc cập nhật item trong cart
 * Nếu sách đã có trong cart -> tăng quantity
 * Nếu chưa có -> thêm mới
 */
cartSchema.methods.addItem = function (bookId, quantity, price) {
  const existingItem = this.items.find(
    (item) => item.book.toString() === bookId.toString(),
  );

  if (existingItem) {
    // Sách đã có trong cart -> cập nhật quantity
    existingItem.quantity += quantity;
  } else {
    // Sách chưa có -> thêm mới
    this.items.push({
      book: bookId,
      quantity: quantity,
      priceAtAdd: price,
      addedAt: new Date(),
    });
  }

  return this.save();
};

/**
 * Instance method: Cập nhật quantity của một item
 */
cartSchema.methods.updateItemQuantity = function (bookId, quantity) {
  const item = this.items.find(
    (item) => item.book.toString() === bookId.toString(),
  );

  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    // Nếu quantity <= 0 -> xóa item
    return this.removeItem(bookId);
  }

  item.quantity = quantity;
  return this.save();
};

/**
 * Instance method: Xóa item khỏi cart
 */
cartSchema.methods.removeItem = function (bookId) {
  this.items = this.items.filter(
    (item) => item.book.toString() !== bookId.toString(),
  );
  return this.save();
};

/**
 * Instance method: Xóa toàn bộ cart (sau khi checkout)
 */
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

/**
 * Static method: Lấy hoặc tạo cart cho user
 */
cartSchema.statics.getOrCreateCart = async function (userId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: "items.book",
    select: "title author price imageUrl stock visibility",
  });

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
