import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "News title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "News content is required"],
      trim: true,
      maxlength: [10000, "Content cannot exceed 10000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

newsSchema.index({ showOnHomepage: 1, createdAt: -1 });
newsSchema.index({ createdAt: -1 });

const News = mongoose.model("News", newsSchema);

export default News;
