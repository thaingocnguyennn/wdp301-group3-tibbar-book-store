import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportConversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isReadByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isReadByCustomer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

supportMessageSchema.index({ conversation: 1, createdAt: 1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
