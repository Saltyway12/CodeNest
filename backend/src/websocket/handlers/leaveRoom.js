/**
 * ---------------------------------------------------------
 *  LEAVE_ROOM Handler
 * ---------------------------------------------------------
 *  FR : Gestion de la déconnexion d'un client WebSocket.
 *       Cette version refactorisée conserve le comportement
 *       de CodeNest V1 : suppression du client de la room,
 *       nettoyage automatique si la room devient vide.
 *
 *  EN : Handles the disconnection of a WebSocket client.
 *       This refactored version preserves CodeNest V1 logic:
 *       removing the client from the room and cleaning the
 *       room if it becomes empty.
 * ---------------------------------------------------------
 */

import { rooms, cleanupRooms, getRoom } from "../rooms.js";

export function handleLeaveRoom(wss, ws, message = {}) {
	// -----------------------------------------------------
	// Extract room info from WS client (not from message)
	// -----------------------------------------------------
	// FR : En V1, la déconnexion ne dépend PAS du payload
	// EN : In V1, disconnection does NOT rely on a payload
	const roomId = ws.roomId;

	if (!roomId) {
		console.warn("Client disconnected without roomId");
		return;
	}

	const room = getRoom(roomId);

	// -----------------------------------------------------
	// Remove client from room
	// -----------------------------------------------------
	room.clients.delete(ws);

	console.log(`Client left room ${roomId}`);

	// -----------------------------------------------------
	// If room becomes empty, delete it
	// -----------------------------------------------------
	cleanupRooms(); // identical behavior to V1

	// -----------------------------------------------------
	// Optionally broadcast to others (not required in V1)
	// -----------------------------------------------------
	// FR : On pourrait notifier les autres clients, mais la V1
	//      ne le faisait pas. Pour rester fidèle -> on s'abstient.
	//
	// EN : We *could* notify other clients, but V1 didn't.
	//      To maintain exact behavior -> we skip it.
}
