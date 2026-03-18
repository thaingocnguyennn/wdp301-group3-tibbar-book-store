import express from "express";
import sliderController from "../controllers/sliderController.js";

const router = express.Router();

router.get("/", sliderController.getPublicSliders);

export default router;
