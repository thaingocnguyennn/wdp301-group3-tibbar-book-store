import mongoose from "mongoose";

/**
 * Slider Model - Quản lý các slider/banner hiển thị trên trang chủ
 *
 * Schema này định nghĩa cấu trúc dữ liệu cho slider bao gồm:
 * - Thông tin cơ bản: title, description, imageUrl
 * - Liên kết đến sách (nếu slider quảng cáo một cuốn sách cụ thể)
 * - Thứ tự hiển thị (order) để sắp xếp các slider
 * - Trạng thái hiển thị (visibility) để bật/tắt slider
 * - Timestamps tự động (createdAt, updatedAt)
 */
const sliderSchema = new mongoose.Schema(
  {
    // Tiêu đề slider - hiển thị trên banner
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: "",
    },

    // Mô tả ngắn - text phụ trên slider
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // URL ảnh slider (có thể lưu local hoặc cloud)
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },

    // Link đến sách (optional) - nếu slider quảng cáo một cuốn sách
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },

    // URL custom (nếu muốn link đến trang khác thay vì book detail)
    linkUrl: {
      type: String,
      trim: true,
    },

    // Thứ tự hiển thị - số càng nhỏ càng ưu tiên
    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"],
    },

    // Trạng thái hiển thị
    visibility: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index để tối ưu query
sliderSchema.index({ visibility: 1, order: 1 }); // Composite index cho việc lấy slider public theo order
sliderSchema.index({ createdAt: -1 }); // Index cho việc sắp xếp theo thời gian

/**
 * Static method: Lấy tất cả slider visible và sắp xếp theo order
 * Dùng cho public API (không cần authentication)
 */
sliderSchema.statics.getVisibleSliders = function () {
  return this.find({ visibility: "visible" })
    .populate("bookId", "title author price imageUrl")
    .sort({ order: 1, createdAt: -1 })
    .limit(5)
    .lean();
};

const Slider = mongoose.model("Slider", sliderSchema);

export default Slider;
