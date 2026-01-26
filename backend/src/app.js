import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import adminBookRoutes from "./routes/adminBookRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";
import ApiResponse from "./utils/ApiResponse.js";
import { HTTP_STATUS } from "./config/constants.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use("/api/sliders", sliderRoutes); // Slider routes (public + admin)
app.use("/api/cart", cartRoutes); // Cart routes (authenticated users)
app.use("/api/admin/books", adminBookRoutes);
app.use("/api/admin/categories", categoryRoutes); // Admin categories (same routes, protected)

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
