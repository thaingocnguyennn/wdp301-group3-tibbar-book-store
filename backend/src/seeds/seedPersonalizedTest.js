import dotenv from "dotenv";
import connectDB from "../config/database.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import { ROLES, BOOK_VISIBILITY } from "../config/constants.js";

dotenv.config();

const TEST_USER = {
  email: "personalized.tester@example.com",
  password: "Customer@123",
  firstName: "Personalized",
  lastName: "Tester",
  role: ROLES.CUSTOMER,
  phone: "+84901234567",
  isActive: true,
};

const CATEGORY_SEEDS = [
  {
    name: "Personalized - Technology",
    description: "Tech books for recommendation testing.",
  },
  {
    name: "Personalized - Self Help",
    description: "Self-help books for recommendation testing.",
  },
  {
    name: "Personalized - Fiction",
    description: "Fiction books for recommendation testing.",
  },
];

const BOOK_SEEDS = [
  {
    title: "Node.js Architecture Essentials",
    author: "Alice Dev",
    categoryName: "Personalized - Technology",
    price: 180000,
    stock: 25,
    isbn: "PERSO-ISBN-0001",
    description: "Advanced Node.js architecture for scalable services.",
  },
  {
    title: "MongoDB for Production Teams",
    author: "Alice Dev",
    categoryName: "Personalized - Technology",
    price: 165000,
    stock: 20,
    isbn: "PERSO-ISBN-0002",
    description: "Practical MongoDB patterns for real-world systems.",
  },
  {
    title: "Express API Playbook",
    author: "Brian Backend",
    categoryName: "Personalized - Technology",
    price: 150000,
    stock: 15,
    isbn: "PERSO-ISBN-0003",
    description: "A complete guide for robust Express APIs.",
  },
  {
    title: "Atomic Habit Shifts",
    author: "Carol Growth",
    categoryName: "Personalized - Self Help",
    price: 130000,
    stock: 30,
    isbn: "PERSO-ISBN-0004",
    description: "Build daily systems and improve consistency.",
  },
  {
    title: "Focus in Noisy Times",
    author: "Carol Growth",
    categoryName: "Personalized - Self Help",
    price: 125000,
    stock: 18,
    isbn: "PERSO-ISBN-0005",
    description: "Mindset and routines for deep work.",
  },
  {
    title: "Mystery by the River",
    author: "Dana Story",
    categoryName: "Personalized - Fiction",
    price: 110000,
    stock: 22,
    isbn: "PERSO-ISBN-0006",
    description: "A suspense mystery in a small riverside town.",
  },
  {
    title: "Winter Letters",
    author: "Evan Tale",
    categoryName: "Personalized - Fiction",
    price: 98000,
    stock: 28,
    isbn: "PERSO-ISBN-0007",
    description: "A heartfelt fiction story about family and memory.",
  },
  {
    title: "Cloud Native Patterns",
    author: "Alice Dev",
    categoryName: "Personalized - Technology",
    price: 195000,
    stock: 12,
    isbn: "PERSO-ISBN-0008",
    description: "Cloud-native patterns for resilient applications.",
  },
  {
    title: "Productive Mornings",
    author: "Carol Growth",
    categoryName: "Personalized - Self Help",
    price: 118000,
    stock: 16,
    isbn: "PERSO-ISBN-0009",
    description: "Morning routines to increase personal productivity.",
  },
  {
    title: "Night Train to Saigon",
    author: "Dana Story",
    categoryName: "Personalized - Fiction",
    price: 108000,
    stock: 21,
    isbn: "PERSO-ISBN-0010",
    description: "A fast-paced thriller across Vietnam.",
  },
];

const ORDER_SEEDS = [
  {
    orderNumber: "PERSO-TEST-1001",
    bookIsbns: ["PERSO-ISBN-0001", "PERSO-ISBN-0002"],
    quantities: [1, 2],
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
  },
  {
    orderNumber: "PERSO-TEST-1002",
    bookIsbns: ["PERSO-ISBN-0004", "PERSO-ISBN-0008"],
    quantities: [1, 1],
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
  },
  {
    orderNumber: "PERSO-TEST-1003",
    bookIsbns: ["PERSO-ISBN-0006"],
    quantities: [1],
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
  },
];

const getOrCreateUser = async () => {
  let user = await User.findOne({ email: TEST_USER.email });

  if (!user) {
    user = await User.create(TEST_USER);
    console.log(`✅ Created test user: ${TEST_USER.email}`);
  } else {
    user.firstName = TEST_USER.firstName;
    user.lastName = TEST_USER.lastName;
    user.phone = TEST_USER.phone;
    user.role = TEST_USER.role;
    user.isActive = true;
    user.password = TEST_USER.password;
    await user.save();
    console.log(`⏭️  Test user exists: ${TEST_USER.email}`);
    console.log("✅ Synced test user credentials and active status");
  }

  return user;
};

const seedCategories = async () => {
  const categoryByName = new Map();

  for (const categorySeed of CATEGORY_SEEDS) {
    let category = await Category.findOne({ name: categorySeed.name });

    if (!category) {
      category = await Category.create(categorySeed);
      console.log(`✅ Created category: ${categorySeed.name}`);
    } else {
      console.log(`⏭️  Category exists: ${categorySeed.name}`);
    }

    categoryByName.set(category.name, category);
  }

  return categoryByName;
};

const seedBooks = async (categoryByName) => {
  const bookByIsbn = new Map();

  for (const bookSeed of BOOK_SEEDS) {
    const category = categoryByName.get(bookSeed.categoryName);

    if (!category) {
      throw new Error(`Category not found for book seed: ${bookSeed.title}`);
    }

    let book = await Book.findOne({ isbn: bookSeed.isbn });

    if (!book) {
      book = await Book.create({
        title: bookSeed.title,
        author: bookSeed.author,
        category: category._id,
        price: bookSeed.price,
        stock: bookSeed.stock,
        isbn: bookSeed.isbn,
        description: bookSeed.description,
        visibility: BOOK_VISIBILITY.PUBLIC,
      });
      console.log(`✅ Created book: ${bookSeed.title}`);
    } else {
      console.log(`⏭️  Book exists: ${bookSeed.title}`);
    }

    bookByIsbn.set(bookSeed.isbn, book);
  }

  return bookByIsbn;
};

const seedOrders = async (userId, bookByIsbn) => {
  for (const orderSeed of ORDER_SEEDS) {
    const existingOrder = await Order.findOne({
      orderNumber: orderSeed.orderNumber,
    });

    if (existingOrder) {
      console.log(`⏭️  Order exists: ${orderSeed.orderNumber}`);
      continue;
    }

    const items = orderSeed.bookIsbns.map((isbn, index) => {
      const book = bookByIsbn.get(isbn);
      if (!book) {
        throw new Error(`Book not found for order seed: ${isbn}`);
      }

      const quantity = orderSeed.quantities[index] || 1;
      const subtotal = Number(book.price) * quantity;

      return {
        book: book._id,
        title: book.title,
        author: book.author,
        price: Number(book.price),
        quantity,
        subtotal,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const now = new Date();

    await Order.create({
      orderNumber: orderSeed.orderNumber,
      user: userId,
      items,
      subtotal,
      discount: 0,
      coinsUsed: 0,
      shippingFee,
      total,
      paymentMethod: "COD",
      paymentStatus: orderSeed.paymentStatus,
      orderStatus: orderSeed.orderStatus,
      paidAt: orderSeed.paymentStatus === "PAID" ? now : null,
      deliveredAt: orderSeed.orderStatus === "DELIVERED" ? now : null,
      shippingAddress: {
        fullName: "Personalized Tester",
        phone: "+84901234567",
        province: "Hanoi",
        district: "Cau Giay",
        commune: "Dich Vong",
        description: "Seed address for personalized testing",
      },
      notes: "Seed data for personalized homepage testing",
    });

    console.log(`✅ Created order: ${orderSeed.orderNumber}`);
  }
};

const seedRecentlyViewed = async (user) => {
  const preferredIsbns = [
    "PERSO-ISBN-0008",
    "PERSO-ISBN-0002",
    "PERSO-ISBN-0001",
    "PERSO-ISBN-0004",
    "PERSO-ISBN-0005",
  ];

  const books = await Book.find({ isbn: { $in: preferredIsbns } })
    .select("_id isbn")
    .lean();
  const idByIsbn = new Map(books.map((book) => [book.isbn, book._id]));

  user.recentlyViewed = preferredIsbns
    .map((isbn) => idByIsbn.get(isbn))
    .filter(Boolean);

  await user.save();
  console.log("✅ Updated recentlyViewed for personalized tester");
};

const run = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding personalized test data...\n");

    const user = await getOrCreateUser();
    const categoryByName = await seedCategories();
    const bookByIsbn = await seedBooks(categoryByName);

    await seedOrders(user._id, bookByIsbn);
    await seedRecentlyViewed(user);

    console.log("\n🎯 Personalized test account:");
    console.log("   - Email: personalized.tester@example.com");
    console.log("   - Password: Customer@123");
    console.log("\n📌 Suggested test flow:");
    console.log("   1) Login with account above");
    console.log("   2) Open Home page");
    console.log('   3) Check section "Recommended For You"');
    console.log("   4) Compare with endpoint GET /api/books/personalized");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding personalized test data:", error);
    process.exit(1);
  }
};

run();
