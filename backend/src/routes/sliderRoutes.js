import express from "express";
import sliderController from "../controllers/sliderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../config/constants.js";

/**
 * Slider Routes
 *
 * PUBLIC ROUTES: /api/sliders/*
 * - Không cần authentication
 * - Chỉ trả về slider visible
 *
 * ADMIN ROUTES: /api/admin/sliders/*
 * - Cần authentication + admin role
 * - CRUD đầy đủ
 */

const router = express.Router();

// ======================
// PUBLIC ROUTES
// ======================

/**
 * GET /api/sliders/public
 * Lấy danh sách slider đang hiển thị
 * Access: Public (no auth required)
 */
router.get("/public", sliderController.getVisibleSliders);

// ======================
// ADMIN ROUTES
// ======================

/**
 * GET /api/admin/sliders
 * Lấy tất cả sliders (bao gồm hidden)
 * Query params:
 *   - visibility: 'visible' | 'hidden' (optional)
 *   - sortBy: 'order' | 'createdAt' (default: 'order')
 *   - sortOrder: 'asc' | 'desc' (default: 'asc')
 * Access: Admin only
 */
router.get(
  "/admin",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.getAllSliders,
);

/**
 * GET /api/admin/sliders/:id
 * Lấy chi tiết một slider
 * Access: Admin only
 */
router.get(
  "/admin/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.getSliderById,
);

/**
 * POST /api/admin/sliders
 * Tạo slider mới
 * Body: { title, description, imageUrl, bookId, linkUrl, order, visibility }
 * Access: Admin only
 */
router.post(
  "/admin",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.createSlider,
);

/**
 * PUT /api/admin/sliders/:id
 * Cập nhật slider
 * Body: { title, description, imageUrl, bookId, linkUrl, order, visibility }
 * Access: Admin only
 */
router.put(
  "/admin/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.updateSlider,
);

/**
 * PATCH /api/admin/sliders/:id/visibility
 * Thay đổi visibility của slider
 * Body: { visibility: 'visible' | 'hidden' }
 * Access: Admin only
 */
router.patch(
  "/admin/:id/visibility",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.toggleVisibility,
);

/**
 * DELETE /api/admin/sliders/:id
 * Xóa slider
 * Access: Admin only
 */
router.delete(
  "/admin/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  sliderController.deleteSlider,
);

export default router;
