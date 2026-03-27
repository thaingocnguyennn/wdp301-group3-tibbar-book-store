import express from "express";
import cvController from "../controllers/cvController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { cvUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.CUSTOMER));

router.get("/my-applications", cvController.getMyApplications);
router.post("/upload", cvUpload.single("cvFile"), cvController.createMyApplication);

export default router;
