/**
 * ---------------------------------------------------------
 *  Chat Controller
 * ---------------------------------------------------------
 *  FR : Gère la réception des requêtes HTTP et délègue la
 *       logique au ChatService.
 *
 *  EN : Handles the HTTP requests and delegates logic to
 *       the ChatService.
 * ---------------------------------------------------------
 */

import {
	getOrCreateChannel,
	getMessages,
	sendMessage,
	getUserChannels,
} from "../services/chat.service.js";

/* ---------------------------------------------------------
 *  GET /chat/messages/:partnerId
 * ------------------------------------------------------- */
export async function fetchMessages(req, res) {
	try {
		const messages = await getMessages(req.userId, req.params.partnerId);
		return res.status(200).json(messages);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  POST /chat/messages/:partnerId
 * ------------------------------------------------------- */
export async function postMessage(req, res) {
	try {
		const message = await sendMessage(
			req.userId,
			req.params.partnerId,
			req.body.text
		);
		return res.status(201).json(message);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  GET /chat/channels
 * ------------------------------------------------------- */
export async function listChannels(req, res) {
	try {
		const channels = await getUserChannels(req.userId);
		return res.status(200).json(channels);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}
