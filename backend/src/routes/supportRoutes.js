import express from "express";
import supportController from "../controllers/supportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/conversation", supportController.getMyConversation);
router.post("/messages", supportController.sendMyMessage);

export default router;
