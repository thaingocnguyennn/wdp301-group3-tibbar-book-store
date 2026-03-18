import express from "express";
import supportController from "../controllers/supportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/conversations", supportController.getAdminConversations);
router.get("/conversations/:conversationId/messages", supportController.getAdminConversationMessages);
router.post("/conversations/:conversationId/messages", supportController.sendAdminMessage);
router.get("/unread-summary", supportController.getAdminUnreadSummary);

export default router;
