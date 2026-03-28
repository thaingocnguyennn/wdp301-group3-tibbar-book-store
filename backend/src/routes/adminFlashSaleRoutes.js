import express from "express";
import adminFlashSaleController from "../controllers/adminFlashSaleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/current", adminFlashSaleController.getCurrentFlashSale);
router.put("/current", adminFlashSaleController.upsertFlashSale);
router.delete("/current", adminFlashSaleController.clearFlashSale);

export default router;
