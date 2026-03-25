import mongoose from 'mongoose';

// Lưu email đăng ký nhận thông báo khi sách có hàng lại
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

// 1 email chỉ đăng ký 1 lần cho 1 sách
backStockSubscriptionSchema.index({ book: 1, email: 1 }, { unique: true });

const BackStockSubscription = mongoose.model('BackStockSubscription', backStockSubscriptionSchema);
export default BackStockSubscription;