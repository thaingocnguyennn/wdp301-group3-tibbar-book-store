import express from "express";
import adminVoucherController from "../controllers/adminVoucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", adminVoucherController.getAllVouchers);
router.post("/", adminVoucherController.createVoucher);
router.put("/:id", adminVoucherController.updateVoucher);
router.post("/:id/assign-users", adminVoucherController.assignVoucherToUsers);

export default router;
