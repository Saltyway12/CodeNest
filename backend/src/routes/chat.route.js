import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken } from "../controllers/chat.controller.js";

// Création du routeur Express pour les routes liées au chat
const router = express.Router();

// Route GET pour générer et récupérer un token d'authentification Stream
// Protégée par middleware d'authentification
// Endpoint: GET /api/chat/token
router.get("/token", protectRoute, getStreamToken);

// Export du routeur pour intégration dans le serveur principal
export default router;
