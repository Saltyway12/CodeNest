/**
 * ---------------------------------------------------------
 *  CODE_UPDATE Handler
 * ---------------------------------------------------------
 *  FR : Gère les mises à jour du code envoyées par un client
 *       et les diffuse à tous les autres participants de la
 *       même room. Le comportement est identique à la V1,
 *       avec une organisation plus propre et du code lisible.
 *
 *  EN : Handles code updates sent by a client and broadcasts
 *       them to all other participants in the same room.
 *       Behavior is identical to V1, but cleaner and clearer.
 * ---------------------------------------------------------
 */

import { getRoom } from "../rooms.js";
import { broadcastRoom } from "../utils/broadcastRoom.js";

export function handleCodeUpdate(wss, ws, message) {
	const { roomId, content, userId } = message;

	// -----------------------------------------------------
	// Minimal validation: roomId and content must exist
	// -----------------------------------------------------
	if (!roomId || typeof roomId !== "string") {
		console.warn("Invalid CODE_UPDATE payload:", message);
		return;
	}

	// FR : Récupère la room (créée si elle n'existe pas)
	// EN : Retrieves the room (created if it doesn't exist)
	const room = getRoom(roomId);

	// -----------------------------------------------------
	// Update shared room content (same behavior as V1)
	// -----------------------------------------------------
	room.content = content;

	console.log(`Code update in room ${roomId} by ${userId || "unknown"}`);

	// -----------------------------------------------------
	// Broadcast update to all room members EXCEPT sender
	// -----------------------------------------------------
	broadcastRoom(
		wss,
		roomId,
		{
			type: "CODE_UPDATE",
			roomId,
			content,
			userId: userId || null,
		},
		ws
	); // ← Important pour exclure l'émetteur
}
