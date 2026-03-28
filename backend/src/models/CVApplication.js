import mongoose from "mongoose";

const cvApplicationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    cvFileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

cvApplicationSchema.index({ createdAt: -1 });
cvApplicationSchema.index({ customer: 1, createdAt: -1 });

const CVApplication = mongoose.model("CVApplication", cvApplicationSchema);

export default CVApplication;
