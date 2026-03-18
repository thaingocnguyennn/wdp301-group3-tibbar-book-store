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
      type: String,
      enum: ["UNUSED", "USED", "EXPIRED"],
      default: "UNUSED",
    },
    usedAt: {
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
