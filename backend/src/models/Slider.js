import mongoose from "mongoose";
import { BOOK_VISIBILITY } from "../config/constants.js";

const sliderSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
    },
    ctaText: {
      type: String,
      trim: true,
      maxlength: [40, "CTA text cannot exceed 40 characters"],
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: Object.values(BOOK_VISIBILITY),
      default: BOOK_VISIBILITY.PUBLIC,
    },
  },
  {
    timestamps: true,
  },
);

sliderSchema.index({ visibility: 1, createdAt: -1 });

const Slider = mongoose.model("Slider", sliderSchema);

export default Slider;
