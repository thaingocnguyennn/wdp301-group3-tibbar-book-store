import mongoose from "mongoose";

// Order item schema for each book in the order
const orderItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Main order schema
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },

    // Price breakdown
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },

    // Payment information
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    // Order status
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    // 🔥 THÊM ĐOẠN NÀY
    assignmentStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: null,
    },
    rejectedShippers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    // Shipping address snapshot (stored at order time)
    shippingAddress: {
      addressId: { type: String, default: null },
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      province: { type: String, default: "" },
      district: { type: String, default: "" },
      commune: { type: String, default: "" },
      description: { type: String, default: "" },
    },

    // Voucher (placeholder for future module)
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      default: null,
    },

    // Payment provider transaction ID (for VNPAY)
    transactionId: {
      type: String,
      default: null,
    },

    // Notes
    notes: {
      type: String,
      default: "",
    },

    // Timestamps for payment and delivery
    paidAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // ================= ASSIGNMENT FIELDS =================

    assignmentStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: null,
    },

    assignmentExpiresAt: {
      type: Date,
      default: null,
    },

    reassignCount: {
      type: Number,
      default: 0,
    },

    assignmentHistory: [
      {
        shipper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        assignedAt: Date,
        respondedAt: Date,
        status: {
          type: String,
          enum: ["ACCEPTED", "REJECTED", "EXPIRED"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
