import mongoose from 'mongoose';
import Book from '../models/Book.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MIN_PRICE = 50000;  // Minimum price: 50,000 VND
const MAX_PRICE = 120000; // Maximum price: 120,000 VND

// Function to generate random price within range (rounded to thousands)
function getRandomPrice(min, max) {
  const minThousands = Math.ceil(min / 1000);
  const maxThousands = Math.floor(max / 1000);
  const randomThousands = Math.floor(Math.random() * (maxThousands - minThousands + 1)) + minThousands;
  return randomThousands * 1000;
}

async function updateBookPrices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('✅ Connected to MongoDB');

    // Get all books
    const books = await Book.find({});
    console.log(`📚 Found ${books.length} books`);

    if (books.length === 0) {
      console.log('⚠️ No books found in database');
      process.exit(0);
    }

    console.log('\n📊 Current prices:');
    books.forEach((book) => {
      console.log(`  - ${book.title}: ${book.price.toLocaleString('vi-VN')}₫`);
    });

    // Update all book prices with random values
    const updatePromises = books.map(async (book) => {
      const oldPrice = book.price;
      const newPrice = getRandomPrice(MIN_PRICE, MAX_PRICE);
      
      await Book.findByIdAndUpdate(book._id, { price: newPrice });
      return { title: book.title, oldPrice, newPrice };
    });

    const results = await Promise.all(updatePromises);

    console.log('\n✅ Price update completed!');
    console.log('\n📈 Updated prices:');
    results.forEach(({ title, oldPrice, newPrice }) => {
      const change = newPrice - oldPrice;
      const changeSign = change >= 0 ? '+' : '';
      console.log(`  - ${title}: ${oldPrice.toLocaleString('vi-VN')}₫ → ${newPrice.toLocaleString('vi-VN')}₫ (${changeSign}${change.toLocaleString('vi-VN')}₫)`);
    });

    console.log(`\n✨ Successfully updated ${results.length} books with random prices from ${MIN_PRICE.toLocaleString('vi-VN')}₫ to ${MAX_PRICE.toLocaleString('vi-VN')}₫`);

  } catch (error) {
    console.error('❌ Error updating book prices:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
updateBookPrices();
