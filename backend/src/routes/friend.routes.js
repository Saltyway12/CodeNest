import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

import {
	listFriends,
	incomingRequests,
	outgoingRequests,
	createFriendRequest,
	acceptRequest,
} from "../controllers/friend.controller.js";

const router = express.Router();

/* ---------------------------------------------------------
 *  Legacy V1 routes
 * --------------------------------------------------------- */

// Liste des amis (ancienne route)
router.get("/amis", authMiddleware, listFriends);

// Nouvelle route ALIAS intuitive : /users/friends
router.get("/friends", authMiddleware, listFriends);

// Demandes entrantes (V1)
router.get("/friend-requests", authMiddleware, incomingRequests);

// Demandes sortantes (V1)
router.get("/outgoing-friend-requests", authMiddleware, outgoingRequests);

// Envoyer une demande (V1)
router.post("/friend-request/:userId", authMiddleware, createFriendRequest);

// Accepter une demande (V1)
router.post("/friend-request/:requestId/accept", authMiddleware, acceptRequest);

/* ---------------------------------------------------------
 *  Professional API routes (/api/friends)
 * --------------------------------------------------------- */

router.get("/", authMiddleware, listFriends);
router.get("/incoming", authMiddleware, incomingRequests);
router.get("/outgoing", authMiddleware, outgoingRequests);
router.post("/send/:userId", authMiddleware, createFriendRequest);
router.post("/accept/:requestId", authMiddleware, acceptRequest);

export default router;
