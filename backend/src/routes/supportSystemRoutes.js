import express from "express";
import supportSystemController from "../controllers/supportSystemController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public endpoint: danh sách sự cố (customer front-end dùng để chọn issue type)
router.get("/issues", supportSystemController.getIssueCatalog);

// Route phía dưới yêu cầu người dùng đăng nhập
router.use(authenticate);

router.post("/tickets", supportSystemController.createMyTicket); // customer tạo ticket mới
router.get("/tickets/history", supportSystemController.getMyTicketHistory); // customer lấy lịch sử ticket

export default router;
