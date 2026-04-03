import mongoose from "mongoose";

// Định nghĩa schema cho mục flash sale (sản phẩm có giảm giá trong chiến dịch)
const flashSaleItemSchema = new mongoose.Schema(
  {
    // Tham chiếu đến sách (Book)
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    // Phần trăm giảm giá (từ 10% đến 50%)
    discountPercent: {
      type: Number,
      required: true,
      min: 10,
      max: 50,
    },
  },
  { _id: false },
);

// Định nghĩa schema cho chiến dịch flash sale (ưu đãi bán hàng giới hạn thời gian)
const flashSaleCampaignSchema = new mongoose.Schema(
  {
    // Mảng sách tham gia flash sale (tối đa 5 sách)
    books: {
      type: [flashSaleItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0 && value.length <= 5;
        },
        message: "Flash sale must contain 1 to 5 books",
      },
      required: true,
    },
    // Thời điểm chiến dịch bắt đầu
    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Thời điểm chiến dịch kết thúc
    endsAt: {
      type: Date,
      required: true,
    },
    // Trạng thái hoạt động của chiến dịch
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Admin tạo chiến dịch
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Tạo index để tối ưu truy vấn: tìm chiến dịch đang hoạt động, sắp xếp theo ngày kết thúc
flashSaleCampaignSchema.index({ isActive: 1, endsAt: -1, createdAt: -1 });

// Tạo model FlashSaleCampaign từ schema
const FlashSaleCampaign = mongoose.model("FlashSaleCampaign", flashSaleCampaignSchema);

export default FlashSaleCampaign;
