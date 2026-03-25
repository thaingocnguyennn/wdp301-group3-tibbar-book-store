import express from "express";
import { getInventoryStock } from "../controllers/adminInventory.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Admin - Inventory Management
router.get("/stock", authenticate, authorize(ROLES.ADMIN), getInventoryStock);

export default router;