import mongoose from "mongoose";

const selectedIssueSchema = new mongoose.Schema(
  {
    groupKey: { type: String, required: true, trim: true },
    issueKey: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const adminReplySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const historyEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["created", "admin_reply", "status_changed"],
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["customer", "admin", "system"],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    statusFrom: {
      type: String,
      enum: ["in_progress", "resolved_success"],
      default: null,
    },
    statusTo: {
      type: String,
      enum: ["in_progress", "resolved_success"],
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
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

supportSystemTicketSchema.index({ customer: 1, createdAt: -1 });
supportSystemTicketSchema.index({ status: 1, updatedAt: -1 });

const SupportSystemTicket = mongoose.model("SupportSystemTicket", supportSystemTicketSchema);

export default SupportSystemTicket;
