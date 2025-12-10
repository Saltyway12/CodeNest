/**
 * ---------------------------------------------------------
 *  User Routes (Safe Refactor)
 * ---------------------------------------------------------
 *  FR : Les routes utilisateur, avec compatibilité totale
 *       CodeNest V1 tout en exposant une version professionnelle.
 *
 *  EN : User routes with full backward compatibility for
 *       CodeNest V1 while exposing a professional API version.
 * ---------------------------------------------------------
 */

import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
	getMe,
	listUsers,
	updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

/* ---------------------------------------------------------
 *  LEGACY V1 ROUTES (must NOT break)
 * ---------------------------------------------------------
 *
 *  GET /users
 *  GET /users/moi
 *  PUT /auth/configuration-profil
 * -------------------------------------------------------- */

router.get("/", listUsers);
router.get("/moi", authMiddleware, getMe);
router.put("/configuration-profil", authMiddleware, updateUserProfile);

/* ---------------------------------------------------------
 *  PROFESSIONAL API (clean version)
 * ---------------------------------------------------------
 *
 *  GET /api/users
 *  GET /api/users/me
 *  PUT /api/users/profile
 * -------------------------------------------------------- */

router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateUserProfile);

export default router;
