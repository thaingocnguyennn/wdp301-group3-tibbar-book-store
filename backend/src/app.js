import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import adminBookRoutes from "./routes/adminBookRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import adminSliderRoutes from "./routes/adminSliderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import adminVoucherRoutes from "./routes/adminVoucherRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import shipperRoutes from "./routes/shipperRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import adminNewsRoutes from "./routes/adminNewsRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import ApiResponse from "./utils/ApiResponse.js";
import { HTTP_STATUS } from "./config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const parseAllowedOrigins = () => {
  const defaults = ["http://localhost:5173"];
  const configuredOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL;

  if (!configuredOrigins) {
    return defaults;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients like Postman that do not send Origin.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  return ApiResponse.success(res, HTTP_STATUS.OK, "Server is running", {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes); // Public categories
app.use("/api/admin/books", adminBookRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/categories", categoryRoutes); // Admin categories (same routes, protected)
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/admin/sliders", adminSliderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/vouchers", adminVoucherRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/shipper", shipperRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/admin/news", adminNewsRoutes);

// 404 Handler
app.use("*", (req, res) => {
  return ApiResponse.error(
    res,
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.originalUrl} not found`,
  );
});

// Error Handler (must be last)
app.use(errorHandler);

export default app;
