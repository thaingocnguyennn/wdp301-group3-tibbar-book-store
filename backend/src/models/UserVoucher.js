import mongoose from "mongoose";

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      // UC-91 + UC-92: Trạng thái sử dụng của voucher trong ví user (UNUSED/USED/EXPIRED).
      type: String,
      enum: ["UNUSED", "USED", "EXPIRED"],
      default: "UNUSED",
    },
    usedAt: {
      // UC-91: Thời điểm voucher được sử dụng.
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsage: {
      type: Number,
      default: 1,
      min: 1,
    },
    expiresAt: {
      // UC-92: Thời điểm assignment hết hạn (đồng bộ với expiryDate voucher hoặc rule riêng).
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true });
userVoucherSchema.index({ user: 1, status: 1, expiresAt: 1 });

const UserVoucher = mongoose.model("UserVoucher", userVoucherSchema);

export default UserVoucher;
