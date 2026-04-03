import express from "express";
import supportController from "../controllers/supportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { supportChatUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Customer API routes for support chat
// UC-121: History (get conversation + messages)
router.get("/conversation", supportController.getMyConversation);
// Send message from customer to admin
router.post("/messages", supportController.sendMyMessage);
router.post(
  "/messages/image",
  supportChatUpload.single("image"),
  supportController.sendMyImageMessage,
);

export default router;
