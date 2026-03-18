import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

router.get("/homepage", newsController.getHomepageNews);
router.get("/", newsController.getPublicNews);
router.get("/:id", newsController.getNewsById);

export default router;
