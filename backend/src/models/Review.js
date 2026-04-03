import mongoose from "mongoose";

// Schema cho Review: người dùng viết đánh giá sách (rating, comment, images)
// Hỗ trợ: phản ứng (like/dislike), trả lời admin, upload ảnh
const reviewSchema = new mongoose.Schema(
  {
    // ID người dùng viết review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ID sách được review
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    // Số sao đánh giá (1-5)
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    // Nội dung bình luận text
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Review comment cannot exceed 1000 characters"],
      default: "",
    },
    // Ảnh đính kèm với review (UC-87: Upload review image)
    // Tối đa 5 ảnh, lưu đường dẫn file
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 5,
        message: "You can upload up to 5 images per review",
      },
    },
    // Phản ứng: like (HELPFUL) hoặc dislike từ các user khác (UC-84: Reaction review)
    // Mỗi user chỉ có thể có 1 phản ứng trên 1 review
    reactions: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          // Loại phản ứng: "HELPFUL" (hữu ích) hoặc "DISLIKE" (không hữu ích)
          type: {
            type: String,
            enum: ["HELPFUL", "DISLIKE"],
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    // Trả lời review từ admin/staff (UC-85: Reply review)
    // Admin có thể trả lời bài review của customer
    replies: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          // Role của người trả lời (admin, customer, v.v.)
          role: {
            type: String,
            enum: ["customer", "admin", "manager", "shipper", "guest"],
            default: "customer",
          },
          comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, "Reply cannot exceed 1000 characters"],
          },
          isEdited: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    // Cờ đánh dấu review đã bị sửa (UC-82 liên quan: người dùng có thể xóa hoặc sửa)
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index tìm kiếm review theo sách và thời gian (UC-83: Filter rank star)
reviewSchema.index({ book: 1, createdAt: -1 });
// Index đảm bảo 1 user chỉ viết 1 review cho 1 sách
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
// Index tìm kiếm phản ứng của user (UC-84: Reaction review)
reviewSchema.index({ "reactions.user": 1 });
// Index tìm kiếm trả lời của user (UC-85: Reply review)
reviewSchema.index({ "replies.user": 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
