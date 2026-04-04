import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

router.get("/homepage", newsController.getHomepageNews); //route lay danh sach news cho homepage
router.get("/:id", newsController.getNewsById); //  route lay news theo id cho public

export default router;
