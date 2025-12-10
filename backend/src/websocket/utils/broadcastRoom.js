/**
 * ---------------------------------------------------------
 *  Broadcast Utility (Room-based)
 * ---------------------------------------------------------
 *  FR : Envoie un message JSON à tous les clients connectés
 *       à une room spécifique, en excluant éventuellement
 *       l'émetteur.
 *
 *  EN : Sends a JSON message to all WebSocket clients in a
 *       specific room, optionally excluding the sender.
 * ---------------------------------------------------------
 */

export function broadcastRoom(wss, roomId, payload, excludeClient = null) {
	const message = JSON.stringify(payload);

	wss.clients.forEach((client) => {
		// FR : Le client doit être dans la bonne room
		// EN : Client must belong to the correct room
		if (client.roomId !== roomId) return;

		// FR : Exclut l'émetteur si nécessaire
		// EN : Exclude the sender when needed
		if (excludeClient && client === excludeClient) return;

		// FR : Vérifie que la connexion est ouverte
		// EN : Ensures client connection is open
		if (client.readyState === 1) {
			client.send(message);
		}
	});
}
