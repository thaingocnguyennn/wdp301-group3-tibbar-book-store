import express from "express";
import { getInventoryStock } from "../controllers/adminInventory.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Admin - Inventory Management
// UC-126: API trả tồn kho theo từng đầu sách + tổng tồn kho toàn bộ, yêu cầu login + role admin.
router.get("/stock", authenticate, authorize(ROLES.ADMIN), getInventoryStock);

export default router;