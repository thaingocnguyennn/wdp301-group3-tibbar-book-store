import { Router } from "express";
import chatbotController from "../controllers/chatbotController.js";
import { optionalAuthenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// UC-45 (Chatbot): endpoint nhận câu hỏi và trả lời hướng dẫn liên quan đơn hàng/chi tiết đơn.
// Dùng optionalAuthenticate để khách chưa đăng nhập vẫn chat được,
// còn user đã đăng nhập thì backend vẫn nhận được ngữ cảnh tài khoản.
router.post("/ask", optionalAuthenticate, chatbotController.ask);

export default router;
