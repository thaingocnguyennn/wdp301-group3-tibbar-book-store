import express from "express";
import bookController from "../controllers/bookController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", bookController.getPublicBooks);
router.get("/newest", bookController.getNewestBooks);
// UC-60: Route lấy sách bán chạy nhất
// Endpoint: GET /api/books/best-selling?limit=8
// Mô tả: Trả về danh sách sách bán chạy nhất dựa trên số lượng bán từ đơn hàng đã giao
// Query params: limit (số lượng sách trả về, mặc định 8)
// Không cần authentication vì là dữ liệu công khai
router.get("/best-selling", bookController.getBestSellingBooks);
router.get(
  "/personalized",
  optionalAuthenticate,
  bookController.getPersonalizedBooks,
);
router.get("/recently-viewed", authenticate, bookController.getRecentlyViewed);
router.get("/my-ebooks", authenticate, bookController.getMyEbooks);
// E-book routes must be above /:id to avoid route collision
router.get("/:id/ebook-access", authenticate, bookController.checkEbookAccess);
router.get("/:id/reader-state", authenticate, bookController.getEbookReaderState);
router.put(
  "/:id/reader-state/progress",
  authenticate,
  bookController.updateEbookReaderProgress,
);
router.put(
  "/:id/reader-state/settings",
  authenticate,
  bookController.updateEbookReaderSettings,
);
router.post(
  "/:id/reader-state/bookmarks",
  authenticate,
  bookController.addEbookBookmark,
);
router.delete(
  "/:id/reader-state/bookmarks/:bookmarkId",
  authenticate,
  bookController.deleteEbookBookmark,
);
router.post(
  "/:id/reader-state/annotations",
  authenticate,
  bookController.addEbookAnnotation,
);
router.put(
  "/:id/reader-state/annotations/:annotationId",
  authenticate,
  bookController.updateEbookAnnotation,
);
router.delete(
  "/:id/reader-state/annotations/:annotationId",
  authenticate,
  bookController.deleteEbookAnnotation,
);
router.get("/:id/ebook", authenticate, bookController.streamEbookFile);
router.get("/:id", optionalAuthenticate, bookController.getBookById);

export default router;
