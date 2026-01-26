import express from "express";
import adminSliderController from "../controllers/adminSliderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { sliderUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", adminSliderController.getAllSliders);
router.post(
  "/",
  sliderUpload.single("image"),
  adminSliderController.createSlider,
);
router.put(
  "/:id",
  sliderUpload.single("image"),
  adminSliderController.updateSlider,
);
router.patch("/:id/visibility", adminSliderController.updateVisibility);
router.delete("/:id", adminSliderController.deleteSlider);

export default router;
