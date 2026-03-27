import express from "express";
import adminCvController from "../controllers/adminCvController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.MANAGER));

router.get("/", adminCvController.getAllApplications);
router.patch("/:id/status", adminCvController.updateStatus);

export default router;
