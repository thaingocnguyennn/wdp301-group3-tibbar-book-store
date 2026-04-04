import mongoose from 'mongoose';

// UC-125: Lưu đăng ký nhận thông báo khi sách có hàng lại.
// Dữ liệu chính: book + email + trạng thái active + thời điểm đã thông báo.
const backStockSubscriptionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notifiedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// UC-125: 1 email chỉ đăng ký 1 lần cho 1 sách để tránh spam/trùng dữ liệu.
backStockSubscriptionSchema.index({ book: 1, email: 1 }, { unique: true });

const BackStockSubscription = mongoose.model('BackStockSubscription', backStockSubscriptionSchema);
export default BackStockSubscription;