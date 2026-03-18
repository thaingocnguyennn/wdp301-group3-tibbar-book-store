import mongoose from "mongoose";

const supportConversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: "",
      maxlength: 300,
    },
    unreadForAdmin: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    unreadForCustomer: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const SupportConversation = mongoose.model(
  "SupportConversation",
  supportConversationSchema,
);

export default SupportConversation;
