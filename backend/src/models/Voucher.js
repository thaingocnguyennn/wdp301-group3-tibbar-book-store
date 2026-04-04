import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      // UC-47 + UC-48: Mã voucher hiển thị ở màn hình admin và dùng để tạo mới/tra cứu.
      type: String,
      required: [true, "Voucher code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, "Voucher code cannot exceed 30 characters"],
    },
    discountType: {
      type: String,
      enum: ["PERCENT", "FIXED"],
      default: "PERCENT",
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [1, "Discount value must be greater than 0"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Minimum order value cannot be negative"],
    },
    maxDiscountValue: {
      type: Number,
      default: null,
      min: [0, "Max discount value cannot be negative"],
    },
    expiryDate: {
      // UC-92: Mốc hết hạn để service tự động chuyển voucher sang trạng thái inactive.
      type: Date,
      required: [true, "Expiry date is required"],
    },
    conditions: {
      type: String,
      trim: true,
      maxlength: [500, "Conditions cannot exceed 500 characters"],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    audienceType: {
      // UC-93: PUBLIC = dùng chung, ASSIGNED = chỉ user được chỉ định mới thấy/dùng.
      type: String,
      enum: ["PUBLIC", "ASSIGNED"],
      default: "PUBLIC",
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
      min: [1, "Max usage per user must be at least 1"],
    },
  },
  {
    timestamps: true,
  },
);

voucherSchema.index({ isActive: 1, expiryDate: 1 });

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;
