import { Router } from "express";
import chatbotController from "../controllers/chatbotController.js";
import { optionalAuthenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/ask", optionalAuthenticate, chatbotController.ask);

export default router;
