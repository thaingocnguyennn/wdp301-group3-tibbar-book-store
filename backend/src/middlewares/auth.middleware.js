import { authenticate } from "./authMiddleware.js";
import { authorize } from "./roleMiddleware.js";
import { ROLES } from "../config/constants.js";

// Backward-compatible aliases for legacy imports.
export const verifyToken = authenticate;
export const requireAdmin = authorize(ROLES.ADMIN);