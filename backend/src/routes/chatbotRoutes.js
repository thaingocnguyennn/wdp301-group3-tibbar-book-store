import { Router } from "express";
import chatbotController from "../controllers/chatbotController.js";
import { optionalAuthenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// UC-128 (Chatbot): endpoint nhận câu hỏi và trả lời/gợi ý thông tin cơ bản cho khách hàng.
// Dùng optionalAuthenticate để khách chưa đăng nhập vẫn chat được,
// còn user đã đăng nhập thì backend vẫn nhận được ngữ cảnh tài khoản.
router.post("/ask", optionalAuthenticate, chatbotController.ask);

export default router;
