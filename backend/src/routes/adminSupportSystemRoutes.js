import express from "express";
import supportSystemController from "../controllers/supportSystemController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Các route phía dưới chỉ dành cho admin đã đăng nhập
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Admin ticket inbox + lịch sử
// Các endpoint dưới đây chỉ dành cho admin quản lý support system
router.get("/tickets", supportSystemController.getAdminTicketInbox);
router.get("/tickets/history", supportSystemController.getAdminTicketHistory);
router.post("/tickets/:ticketId/replies", supportSystemController.addAdminReply);
router.patch("/tickets/:ticketId/status", supportSystemController.updateAdminTicketStatus);

export default router;
