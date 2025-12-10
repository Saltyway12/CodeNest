/**
 * ---------------------------------------------------------
 *  Chat Routes
 * ---------------------------------------------------------
 *  FR : Routes du chat utilisant StreamChat. Compatibilité V1
 *       + version professionnelle /api/chat.
 *
 *  EN : Chat routes using StreamChat. V1 compatibility + pro
 *       version under /api/chat.
 * ---------------------------------------------------------
 */

import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

import {
	fetchMessages,
	postMessage,
	listChannels,
} from "../controllers/chat.controller.js";

const router = express.Router();

/* ---------------------------------------------------------
 *  LEGACY V1 ROUTES
 *  (must not break front-end)
 * ------------------------------------------------------- */

router.get("/messages/:partnerId", authMiddleware, fetchMessages);
router.post("/messages/:partnerId", authMiddleware, postMessage);
router.get("/channels", authMiddleware, listChannels);

/* ---------------------------------------------------------
 *  PROFESSIONAL ROUTES
 * ------------------------------------------------------- */

router.get("/api/messages/:partnerId", authMiddleware, fetchMessages);
router.post("/api/messages/:partnerId", authMiddleware, postMessage);
router.get("/api/channels", authMiddleware, listChannels);

export default router;
