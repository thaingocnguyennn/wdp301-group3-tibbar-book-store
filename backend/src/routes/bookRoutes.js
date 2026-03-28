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
