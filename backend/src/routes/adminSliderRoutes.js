import express from "express";
import adminSliderController from "../controllers/adminSliderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { sliderUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Bắt buộc đăng nhập trước khi vào nhóm API admin slider.
router.use(authenticate);
// Bắt buộc quyền admin cho toàn bộ endpoint bên dưới.
router.use(authorize(ROLES.ADMIN));

// UC-23 (Admin view): Lấy toàn bộ slider để quản trị viên xem danh sách.
router.get("/", adminSliderController.getAllSliders);
// UC-24: Tạo slider mới, có thể upload ảnh bằng field "image".
router.post(
  "/",
  sliderUpload.single("image"),
  adminSliderController.createSlider,
);
// UC-25: API sửa slider hiện có (admin).
router.put(
  "/:id",
  // Middleware nhận file ảnh mới (nếu admin upload lại ảnh slider).
  sliderUpload.single("image"),
  adminSliderController.updateSlider,
);
// UC-26: API bật/tắt hiển thị slider (public/hidden).
router.patch("/:id/visibility", adminSliderController.updateVisibility);
router.delete("/:id", adminSliderController.deleteSlider);

export default router;
