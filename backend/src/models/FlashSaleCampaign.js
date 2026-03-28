import mongoose from "mongoose";

const flashSaleItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 10,
      max: 50,
    },
  },
  { _id: false },
);

const flashSaleCampaignSchema = new mongoose.Schema(
  {
    books: {
      type: [flashSaleItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0 && value.length <= 5;
        },
        message: "Flash sale must contain 1 to 5 books",
      },
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

flashSaleCampaignSchema.index({ isActive: 1, endsAt: -1, createdAt: -1 });

const FlashSaleCampaign = mongoose.model("FlashSaleCampaign", flashSaleCampaignSchema);

export default FlashSaleCampaign;
