/**
 * ---------------------------------------------------------
 *  In-Memory WebSocket Rooms Manager
 * ---------------------------------------------------------
 *  FR : Gestion centralisée des salles (rooms) en mémoire.
 *       Cette abstraction permet de maintenir l'état partagé
 *       du code et la liste des clients WebSocket.
 *
 *  EN : Centralized in-memory room manager.
 *       This abstraction stores shared code state and tracks
 *       WebSocket clients within each room.
 * ---------------------------------------------------------
 */

const rooms = new Map();

/**
 * FR : Retourne une room existante ou la crée.
 * EN : Returns an existing room or creates a new one.
 */
export function getRoom(callId) {
	if (!rooms.has(callId)) {
		rooms.set(callId, {
			clients: new Set(),
			content: "", // current code state
		});
	}
	return rooms.get(callId);
}

/**
 * FR : Supprime une room vide.
 * EN : Deletes a room if no client remains.
 */
export function cleanupRooms() {
	rooms.forEach((room, callId) => {
		if (room.clients.size === 0) {
			rooms.delete(callId);
			console.log(`Room cleaned: ${callId}`);
		}
	});
}

/**
 *Expose rooms only for read/write, not replacement.
 */
export { rooms };
