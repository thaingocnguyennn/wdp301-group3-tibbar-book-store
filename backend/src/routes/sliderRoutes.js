import express from "express";
import sliderController from "../controllers/sliderController.js";

const router = express.Router();

// UC-23 (Public view): Lấy danh sách slider đang public để hiển thị ngoài trang chủ.
router.get("/", sliderController.getPublicSliders);

export default router;
