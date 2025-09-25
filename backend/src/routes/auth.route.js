import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	connexion,
	deconnexion,
	inscription,
	onboard,
} from "../controllers/auth.controller.js";

// Création du routeur Express pour les routes d'authentification
const router = express.Router();

// Route POST pour l'inscription d'un nouvel utilisateur
// Endpoint: POST /api/auth/inscription
router.post("/inscription", inscription);

// Route POST pour la connexion d'un utilisateur existant
// Endpoint: POST /api/auth/connexion
router.post("/connexion", connexion);

// Route POST pour la déconnexion de l'utilisateur actuel
// Endpoint: POST /api/auth/deconnexion
router.post("/deconnexion", deconnexion);

// Route POST pour la configuration initiale du profil utilisateur
// Protégée par middleware d'authentification
// Endpoint: POST /api/auth/configuration-profil
router.post("/configuration-profil", protectRoute, onboard);

// Route GET pour récupérer les informations de l'utilisateur connecté
// Protégée par middleware d'authentification
// Endpoint: GET /api/auth/moi
router.get("/moi", protectRoute, (req, res) => {
	res.status(200).json({ success: true, user: req.user });
});

// Export du routeur pour intégration dans le serveur principal
export default router;
