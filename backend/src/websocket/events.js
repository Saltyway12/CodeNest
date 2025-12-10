/**
 * ---------------------------------------------------------
 *  WebSocket Event Dispatcher
 * ---------------------------------------------------------
 *  FR : Réceptionne tous les messages entrants et les
 *       redirige vers les handlers appropriés.
 *
 *  EN : Receives all incoming WebSocket messages and
 *       dispatches them to the correct handlers.
 * ---------------------------------------------------------
 */

import { validateMessage } from "./utils/validateMessage.js";

import { handleJoinRoom } from "./handlers/joinRoom.js";
import { handleLeaveRoom } from "./handlers/leaveRoom.js";
import { handleCodeUpdate } from "./handlers/codeUpdate.js";

export function handleIncomingMessage(wss, ws, rawMessage) {
	let message = null;

	try {
		message = JSON.parse(rawMessage);
	} catch (err) {
		console.warn("Invalid JSON received");
		return;
	}

	// Validate message format
	if (!validateMessage(message)) {
		console.warn("Invalid message structure:", message);
		return;
	}

	const { type } = message;

	switch (type) {
		case "JOIN_ROOM":
			return handleJoinRoom(wss, ws, message);

		case "LEAVE_ROOM":
			return handleLeaveRoom(wss, ws, message);

		case "CODE_UPDATE":
			return handleCodeUpdate(wss, ws, message);

		default:
			console.warn("Unknown event type:", type);
	}
}
