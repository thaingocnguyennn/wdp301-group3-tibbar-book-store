import express from "express";
import cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", cartController.addToCart);
router.patch("/items/:bookId", cartController.updateCartItem);
router.delete("/items/:bookId", cartController.removeCartItem);
router.get("/validate", cartController.validateCart);

export default router;
