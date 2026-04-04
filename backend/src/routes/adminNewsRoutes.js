import express from "express";
import adminNewsController from "../controllers/adminNewsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { newsUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate); // yeu cau xac thuc cho tat ca cac route trong router nay
router.use(authorize(ROLES.ADMIN)); // yeu cau nguoi dung phai co quyen admin de truy cap cac route trong router nay

router.get("/", adminNewsController.getAllNews); //get all news cho admin
router.post("/", newsUpload.single("image"), adminNewsController.createNews); //ham tao news moi
router.put("/:id", newsUpload.single("image"), adminNewsController.updateNews); //ham update news
router.delete("/:id", adminNewsController.deleteNews); //ham delete news

export default router;
