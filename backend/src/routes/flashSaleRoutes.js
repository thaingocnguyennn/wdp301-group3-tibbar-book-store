import express from "express";
import flashSaleController from "../controllers/flashSaleController.js";

const router = express.Router();

router.get("/active", flashSaleController.getActiveFlashSale);

export default router;
