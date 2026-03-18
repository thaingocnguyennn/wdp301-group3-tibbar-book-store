import express from "express";
import adminNewsController from "../controllers/adminNewsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { newsUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", adminNewsController.getAllNews);
router.post("/", newsUpload.single("image"), adminNewsController.createNews);
router.put("/:id", newsUpload.single("image"), adminNewsController.updateNews);
router.delete("/:id", adminNewsController.deleteNews);

export default router;
