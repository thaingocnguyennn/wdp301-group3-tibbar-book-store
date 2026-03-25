import express from "express";
import NotificationController from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, NotificationController.getNotifications);
router.patch("/:id/read", authenticate, NotificationController.markAsRead);

export default router;