import mongoose from "mongoose";

const ebookBookmarkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    page: {
      type: Number,
      required: true,
      min: 1,
    },
    snippet: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

const ebookAnnotationSchema = new mongoose.Schema(
  {
    page: {
      type: Number,
      required: true,
      min: 1,
    },
    snippet: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    color: {
      type: String,
      enum: ["yellow", "mint", "rose", "sky"],
      default: "yellow",
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

const ebookReaderStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    progress: {
      currentPage: {
        type: Number,
        min: 1,
        default: 1,
      },
      completionPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      scrollOffset: {
        type: Number,
        min: 0,
        default: 0,
      },
      lastReadAt: {
        type: Date,
        default: null,
      },
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "sepia"],
        default: "dark",
      },
      fontSize: {
        type: Number,
        min: 14,
        max: 30,
        default: 18,
      },
      fontFamily: {
        type: String,
        enum: ["serif", "sans", "mono"],
        default: "serif",
      },
      lineSpacing: {
        type: Number,
        min: 1.2,
        max: 2.4,
        default: 1.6,
      },
      zoomPercent: {
        type: Number,
        min: 80,
        max: 180,
        default: 100,
      },
    },
    bookmarks: {
      type: [ebookBookmarkSchema],
      default: [],
    },
    annotations: {
      type: [ebookAnnotationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ebookReaderStateSchema.index({ user: 1, book: 1 }, { unique: true });

const EbookReaderState = mongoose.model(
  "EbookReaderState",
  ebookReaderStateSchema,
);

export default EbookReaderState;
