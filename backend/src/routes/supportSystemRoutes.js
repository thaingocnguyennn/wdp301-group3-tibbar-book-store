import express from "express";
import supportSystemController from "../controllers/supportSystemController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/issues", supportSystemController.getIssueCatalog);

router.use(authenticate);

router.post("/tickets", supportSystemController.createMyTicket);
router.get("/tickets/history", supportSystemController.getMyTicketHistory);

export default router;
