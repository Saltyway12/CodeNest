/**
 * ---------------------------------------------------------
 *  JOIN_ROOM Handler
 * ---------------------------------------------------------
 *  FR : Gère l'entrée d'un client WebSocket dans une room.
 *       Cette version refactorisée conserve le comportement
 *       d'origine tout en appliquant une validation minimale.
 *
 *  EN : Handles a WebSocket client joining a room.
 *       This refactored version preserves all original
 *       behavior while applying minimal safe validation.
 * ---------------------------------------------------------
 */

import { getRoom } from "../rooms.js";

export function handleJoinRoom(wss, ws, message) {
	const { roomId, userId } = message;

	// -----------------------------------------------------
	// Minimal safe validation
	// -----------------------------------------------------
	// FR : Vérifie que roomId est une string non vide.
	// EN : Ensures roomId is a non-empty string.
	if (!roomId || typeof roomId !== "string") {
		console.warn("Invalid JOIN_ROOM payload:", message);
		return;
	}

	// -----------------------------------------------------
	// Retrieve or create room
	// -----------------------------------------------------
	const room = getRoom(roomId);

	// -----------------------------------------------------
	// Attach room metadata to WS client instance
	// -----------------------------------------------------
	// FR : On stocke ces infos pour simplifier les handlers
	// EN : We store metadata for further handlers use
	ws.roomId = roomId;
	ws.userId = userId || null; // Safe: userId optional in V1

	// -----------------------------------------------------
	// Add client to room
	// -----------------------------------------------------
	room.clients.add(ws);

	console.log(`Client joined room ${roomId}`);

	// -----------------------------------------------------
	// Send initial code state to this new client
	// -----------------------------------------------------
	// FR : Le comportement original renvoie immédiatement
	//       le contenu existant de la room.
	//
	// EN : Original behavior: send the current room content
	//       to the newly connected client.
	ws.send(
		JSON.stringify({
			type: "INITIAL_CONTENT",
			roomId,
			content: room.content || "",
		})
	);

	// -----------------------------------------------------
	// Log and return
	// -----------------------------------------------------
	console.log(`Sent initial code state to client (room: ${roomId})`);
}
