import mongoose from "mongoose";
import Slider from "../models/Slider.js";
import Book from "../models/Book.js";
import { SLIDER_VISIBILITY } from "../config/constants.js";

/**
 * Seed Sliders - Tạo dữ liệu slider mẫu
 *
 * Chạy: node backend/src/seeds/seedSliders.js
 * Hoặc: thêm vào package.json scripts
 */

const seedSliders = async () => {
  try {
    // Get some books to link to sliders
    const books = await Book.find({ visibility: "public" }).limit(5);

    if (books.length === 0) {
      console.log(
        "⚠️  Không có sách nào trong database. Chạy seedBooks trước!",
      );
      return;
    }

    // Clear existing sliders
    await Slider.deleteMany({});
    console.log("🗑️  Đã xóa sliders cũ");

    // Sample slider data
    const sliders = [
      {
        title: "Summer Reading Special 2026",
        description:
          "Discover amazing books for your summer vacation. Limited time offer!",
        imageUrl:
          "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200",
        bookId: books[0]?._id,
        order: 0,
        visibility: SLIDER_VISIBILITY.VISIBLE,
      },
      {
        title: "New Arrivals This Month",
        description: "Check out the latest additions to our collection",
        imageUrl:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200",
        bookId: books[1]?._id,
        order: 1,
        visibility: SLIDER_VISIBILITY.VISIBLE,
      },
      {
        title: "Bestsellers of 2026",
        description: "Most popular books chosen by our readers",
        imageUrl:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200",
        bookId: books[2]?._id,
        order: 2,
        visibility: SLIDER_VISIBILITY.VISIBLE,
      },
      {
        title: "Learn Programming",
        description: "Master coding with our curated selection of tech books",
        imageUrl:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200",
        bookId: books[3]?._id,
        linkUrl: "/categories/programming",
        order: 3,
        visibility: SLIDER_VISIBILITY.VISIBLE,
      },
      {
        title: "Hidden Slider Example",
        description: "This slider is hidden - won't show on homepage",
        imageUrl:
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200",
        bookId: books[4]?._id,
        order: 4,
        visibility: SLIDER_VISIBILITY.HIDDEN,
      },
    ];

    // Insert sliders
    const createdSliders = await Slider.insertMany(sliders);

    console.log(`✅ Đã tạo ${createdSliders.length} sliders:`);
    createdSliders.forEach((slider, index) => {
      console.log(`   ${index + 1}. ${slider.title} [${slider.visibility}]`);
    });
  } catch (error) {
    console.error("❌ Lỗi khi seed sliders:", error.message);
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/bookstore";

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("📦 Connected to MongoDB");
      return seedSliders();
    })
    .then(() => {
      console.log("🎉 Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export default seedSliders;
