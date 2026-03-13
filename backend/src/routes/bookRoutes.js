import express from "express";
import bookController from "../controllers/bookController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", bookController.getPublicBooks);
router.get("/newest", bookController.getNewestBooks);
router.get("/best-selling", bookController.getBestSellingBooks);
router.get(
  "/personalized",
  optionalAuthenticate,
  bookController.getPersonalizedBooks,
);
router.get("/recently-viewed", authenticate, bookController.getRecentlyViewed);
router.get("/:id", authenticate, bookController.getBookById);

export default router;
