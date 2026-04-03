import express from "express";
import supportController from "../controllers/supportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";
import { supportChatUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Admin support inbox API (UC-120 + UC-121)
router.get("/conversations", supportController.getAdminConversations);
router.get("/conversations/:conversationId/messages", supportController.getAdminConversationMessages);
router.post("/conversations/:conversationId/messages", supportController.sendAdminMessage);
router.post(
	"/conversations/:conversationId/messages/image",
	supportChatUpload.single("image"),
	supportController.sendAdminImageMessage,
);
router.get("/unread-summary", supportController.getAdminUnreadSummary);

export default router;
