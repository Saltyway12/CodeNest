/**
 * ---------------------------------------------------------
 *  Friend Controller
 * ---------------------------------------------------------
 *  FR : Reçoit la requête HTTP, délègue au FriendService
 *       et renvoie une réponse formatée.
 *
 *  EN : Receives HTTP requests, delegates to FriendService
 *       and returns formatted responses.
 * ---------------------------------------------------------
 */

import {
	getFriends,
	getIncomingRequests,
	getOutgoingRequests,
	sendFriendRequest,
	acceptFriendRequest,
} from "../services/friend.service.js";

/* ---------------------------------------------------------
 *  GET /users/amis
 * ------------------------------------------------------- */
export async function listFriends(req, res) {
	try {
		const friends = await getFriends(req.userId);
		return res.status(200).json(friends);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  GET /users/friend-requests
 * ------------------------------------------------------- */
export async function incomingRequests(req, res) {
	try {
		const requests = await getIncomingRequests(req.userId);
		return res.status(200).json(requests);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  GET /users/outgoing-friend-requests
 * ------------------------------------------------------- */
export async function outgoingRequests(req, res) {
	try {
		const requests = await getOutgoingRequests(req.userId);
		return res.status(200).json(requests);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  POST /users/friend-request/:userId
 * ------------------------------------------------------- */
export async function createFriendRequest(req, res) {
	try {
		const request = await sendFriendRequest(req.userId, req.params.userId);
		return res.status(201).json(request);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  POST /users/friend-request/:requestId/accept
 * ------------------------------------------------------- */
export async function acceptRequest(req, res) {
	try {
		const updated = await acceptFriendRequest(req.params.requestId, req.userId);
		return res.status(200).json(updated);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}
