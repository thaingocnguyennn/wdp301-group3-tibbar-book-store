import mongoose from "mongoose";

// Schema cho vấn đề khách hàng chọn khi tạo ticket
const selectedIssueSchema = new mongoose.Schema(
  {
    groupKey: { type: String, required: true, trim: true }, // mã nhóm issue, dùng để phân loại vấn đề
    issueKey: { type: String, required: true, trim: true }, // mã issue cụ thể trong nhóm
    label: { type: String, required: true, trim: true }, // tên hiển thị cho issue trên giao diện
  },
  { _id: false },
);

// Schema cho phản hồi của admin trong ticket
const adminReplySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // id admin trả lời ticket
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    }, // nội dung phản hồi của admin
    createdAt: {
      type: Date,
      default: Date.now,
    }, // thời gian admin viết phản hồi
  },
  { _id: false },
);

// Schema ghi lại lịch sử hành động của ticket
const historyEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["created", "admin_reply", "status_changed"],
      required: true,
    }, // loại hành động trong lịch sử ticket
    actorRole: {
      type: String,
      enum: ["customer", "admin", "system"],
      required: true,
    }, // vai trò người thực hiện event
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // id người thực hiện (có thể null nếu system)
    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    }, // nội dung ghi chú của sự kiện
    statusFrom: {
      type: String,
      enum: ["in_progress", "resolved_success"],
      default: null,
    }, // trạng thái cũ trước khi thay đổi
    statusTo: {
      type: String,
      enum: ["in_progress", "resolved_success"],
      default: null,
    }, // trạng thái mới sau khi thay đổi
    createdAt: {
      type: Date,
      default: Date.now,
    }, // thời gian sự kiện xảy ra
  },
  { _id: false },
);

const supportSystemTicketSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    selectedIssues: {
      type: [selectedIssueSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1 && value.length <= 3,
        message: "Selected issues must contain between 1 and 3 items",
      },
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["in_progress", "resolved_success"],
      default: "in_progress",
      index: true,
    },
    adminReplies: {
      type: [adminReplySchema],
      default: [],
    },
    history: {
      type: [historyEntrySchema],
      default: [],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Model chính cho ticket của hệ thống hỗ trợ
// Tạo index để query nhanh theo customer và theo trạng thái
supportSystemTicketSchema.index({ customer: 1, createdAt: -1 });
supportSystemTicketSchema.index({ status: 1, updatedAt: -1 });

const SupportSystemTicket = mongoose.model("SupportSystemTicket", supportSystemTicketSchema);

export default SupportSystemTicket;
