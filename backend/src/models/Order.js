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
  { _id: false },
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
    // UC-44: Dữ liệu lịch sử đơn hàng được đọc từ bảng Order theo user này.
    // UC-45: Khi xem chi tiết đơn, frontend đọc đầy đủ items từ đây.
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
      // UC-91: Giá trị giảm giá áp dụng cho đơn hàng khi dùng voucher.
      type: Number,
      default: 0,
    },
    coinsUsed: {
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
      // UC-46: Quy tắc hủy đơn phụ thuộc vào trạng thái này (chỉ hủy khi PENDING).
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    orderKind: {
      type: String,
      enum: ["PHYSICAL", "DIGITAL"],
      default: "PHYSICAL",
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
        ref: "User",
      },
    ],
    // Bằng chứng giao hàng (ảnh chụp bằng điện thoại của shipper khi giao hàng thành công)
    deliveryProof: {
      imageUrl: String,
      uploadedAt: Date,
    },
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

    // UC-91: Liên kết voucher đã dùng cho đơn để truy vết lịch sử sử dụng theo order.
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
      // UC-88: Ghi chú có thể được mang sang đơn mới khi đặt lại đơn (order again).
      type: String,
      default: "",
    },

    // Customer return / refund request
    returnRequest: {
      // UC-90: Snapshot yêu cầu trả hàng/hoàn tiền do khách hàng gửi.
      type: {
        type: String,
        enum: ["RETURN", "REFUND"],
        default: null,
      },
      reason: {
        type: String,
        default: "",
      },
      details: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
        default: null,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      adminNote: {
        type: String,
        default: "",
      },
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

    assignmentExpiresAt: {
      type: Date,
      default: null,
    },

    reassignCount: {
      type: Number,
      default: 0,
    },

    assignmentHistory: {
      type: [
        {
          shipper: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          assignedAt: Date,
          respondedAt: Date,
          status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
          },
        },
      ],
      default: [],
    },
    // Customer feedback after delivery
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: "",
      },
      shipper: {   // 🔥 THÊM DÒNG NÀY
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
