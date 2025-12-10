/**
 * ---------------------------------------------------------
 *  Auth Routes (Final Professional Version)
 * ---------------------------------------------------------
 *  FR : Déclare toutes les routes d'authentification.
 *       - Compatibilité V1 (routes FR)
 *       - API moderne sous /api/auth/*
 *       - Protection avec middleware JWT
 *       - Limitation brute-force sur /login
 *
 *  EN : Declares all authentication routes.
 *       - V1 compatibility (French routes)
 *       - Modern API under /api/auth/*
 *       - JWT protection
 *       - Brute-force limiter on login
 * ---------------------------------------------------------
 */

import express from "express";
import { signup, login, me, logout } from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { loginRateLimiter } from "../middleware/loginRateLimiter.middleware.js";

const router = express.Router();

/* ---------------------------------------------------------
 *  ROUTES V1 (FR) — Compatibilité frontend actuel
 * ---------------------------------------------------------
 *
 *  POST /auth/inscription
 *  POST /auth/connexion
 *  GET  /auth/moi
 *  POST /auth/deconnexion
 * --------------------------------------------------------- */

router.post("/inscription", signup);
router.post("/connexion", loginRateLimiter, login);
router.get("/moi", authMiddleware, me);
router.post("/deconnexion", logout);

/* ---------------------------------------------------------
 *  ROUTES PRO — /api/auth/*
 * ---------------------------------------------------------
 *
 *  POST /api/auth/signup
 *  POST /api/auth/login
 *  GET  /api/auth/me
 *  POST /api/auth/logout
 * --------------------------------------------------------- */

router.post("/signup", signup);
router.post("/login", loginRateLimiter, login);
router.get("/me", authMiddleware, me);
router.post("/logout", logout);

export default router;
