import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	acceptFriendRequest,
	getFriendRequests,
	getMyFriends,
	getOutgoingFriendReqs,
	getRecommendedUsers,
	sendFriendRequest,
} from "../controllers/user.controller.js";

// Création du routeur Express pour les routes liées aux utilisateurs
const router = express.Router();

// Application du middleware d'authentification à toutes les routes du fichier
// Toutes les routes suivantes nécessitent une authentification valide
router.use(protectRoute);

// Route GET pour obtenir une liste d'utilisateurs recommandés
// Endpoint: GET /api/users/
router.get("/", getRecommendedUsers);

// Route GET pour récupérer la liste des amis de l'utilisateur connecté
// Endpoint: GET /api/users/amis
router.get("/amis", getMyFriends);

// Route POST pour envoyer une demande d'ami à un utilisateur spécifique
// Paramètre: id de l'utilisateur destinataire
// Endpoint: POST /api/users/friend-request/:id
router.post("/friend-request/:id", sendFriendRequest);

// Route PUT pour accepter une demande d'ami reçue
// Paramètre: id de la demande d'ami
// Endpoint: PUT /api/users/friend-request/:id/accept
router.put("/friend-request/:id/accept", acceptFriendRequest);

// Route GET pour récupérer les demandes d'amis reçues en attente
// Endpoint: GET /api/users/friend-requests
router.get("/friend-requests", getFriendRequests);

// Route GET pour récupérer les demandes d'amis envoyées (en attente de réponse)
// Endpoint: GET /api/users/outgoing-friend-requests
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

// Export du routeur pour intégration dans le serveur principal
export default router;
