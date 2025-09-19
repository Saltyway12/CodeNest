import http from "http";
import { WebSocketServer } from "ws";
import url from "url";

// --------------------
// STOCKAGE DES ROOMS EN MÉMOIRE
// --------------------
const rooms = new Map(); // callId -> { clients: Set, content: string }

function getRoom(callId) {
	if (!rooms.has(callId)) {
		rooms.set(callId, {
			clients: new Set(),
			content: "", // Contenu actuel de l'éditeur
		});
	}
	return rooms.get(callId);
}

function cleanupRoom(callId) {
	const room = rooms.get(callId);
	if (room && room.clients.size === 0) {
		rooms.delete(callId);
		console.log(`🧹 Room ${callId} supprimée (plus de clients)`);
	}
}

// --------------------
// GESTION D'UN CLIENT WEBSOCKET
// --------------------
function handleConnection(ws, callId) {
	console.log(`👤 Nouveau client connecté à la room: ${callId}`);

	const room = getRoom(callId);
	room.clients.add(ws);

	// Envoyer le contenu actuel au nouveau client
	ws.send(
		JSON.stringify({
			type: "INITIAL_CONTENT",
			content: room.content,
			timestamp: Date.now(),
		})
	);

	// Notifier les autres clients qu'un nouveau participant a rejoint
	broadcastToRoom(
		callId,
		{
			type: "USER_JOINED",
			participantCount: room.clients.size,
		},
		ws
	);

	// Gérer les messages entrants
	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString());

			switch (message.type) {
				case "DELTA_CHANGE":
					handleDeltaChange(callId, message, ws);
					break;

				case "CURSOR_POSITION":
					handleCursorPosition(callId, message, ws);
					break;

				default:
					console.warn(`⚠️ Type de message inconnu: ${message.type}`);
			}
		} catch (error) {
			console.error("❌ Erreur parsing message:", error);
		}
	});

	// Gérer la déconnexion
	ws.on("close", () => {
		console.log(`👋 Client déconnecté de la room: ${callId}`);
		room.clients.delete(ws);

		// Notifier les autres clients
		if (room.clients.size > 0) {
			broadcastToRoom(callId, {
				type: "USER_LEFT",
				participantCount: room.clients.size,
			});
		}

		cleanupRoom(callId);
	});

	ws.on("error", (error) => {
		console.error("❌ Erreur WebSocket:", error);
		room.clients.delete(ws);
		cleanupRoom(callId);
	});
}

// --------------------
// GESTION DES CHANGEMENTS DELTA
// --------------------
function handleDeltaChange(callId, message, senderWs) {
	const room = getRoom(callId);
	const { changes } = message;

	try {
		// Appliquer les changements au contenu de la room
		let content = room.content;

		// Monaco envoie les changements dans l'ordre, on les applique un par un
		for (const change of changes) {
			const { rangeOffset, rangeLength, text } = change;

			// Supprimer le texte dans la range
			content =
				content.slice(0, rangeOffset) +
				content.slice(rangeOffset + rangeLength);

			// Insérer le nouveau texte
			content =
				content.slice(0, rangeOffset) + text + content.slice(rangeOffset);
		}

		room.content = content;

		// Diffuser les changements aux autres clients
		broadcastToRoom(
			callId,
			{
				type: "DELTA_CHANGE",
				changes: changes,
				timestamp: Date.now(),
			},
			senderWs
		);
	} catch (error) {
		console.error("❌ Erreur application delta:", error);
	}
}

// --------------------
// GESTION CURSEUR
// --------------------
function handleCursorPosition(callId, message, senderWs) {
	broadcastToRoom(
		callId,
		{
			type: "CURSOR_POSITION",
			userId: message.userId,
			position: message.position,
			color: message.color,
		},
		senderWs
	);
}

// --------------------
// DIFFUSION DANS UNE ROOM
// --------------------
function broadcastToRoom(callId, message, excludeWs = null) {
	const room = rooms.get(callId);
	if (!room) return;

	const messageStr = JSON.stringify(message);
	let sentCount = 0;

	room.clients.forEach((client) => {
		if (client !== excludeWs && client.readyState === 1) {
			try {
				client.send(messageStr);
				sentCount++;
			} catch (error) {
				console.error("❌ Erreur envoi message:", error);
				room.clients.delete(client);
			}
		}
	});

	// Debug: afficher le nombre de clients qui ont reçu le message
	if (sentCount > 0) {
		console.log(
			`📡 Message diffusé à ${sentCount} client(s) dans room ${callId}`
		);
	}
}

// --------------------
// SETUP SERVEUR WEBSOCKET
// --------------------
export function setupWebSocketServer(app) {
	const server = http.createServer(app);
	const wss = new WebSocketServer({
		server,
		path: "/ws", // WebSocket disponible sur ws://localhost:5001/ws
	});

	wss.on("connection", (ws, req) => {
		// Extraire callId des query params: ws://localhost:5001/ws?callId=abc123
		const queryParams = url.parse(req.url, true).query;
		const callId = queryParams.callId;

		if (!callId) {
			console.error("❌ CallId manquant dans la connexion WebSocket");
			ws.close(1008, "CallId requis");
			return;
		}

		handleConnection(ws, callId);
	});

	// Statistiques pour le debug des rooms actives
	setInterval(() => {
		if (rooms.size > 0) {
			console.log(`📊 Rooms actives: ${rooms.size}`);
			rooms.forEach((room, callId) => {
				console.log(`  - ${callId}: ${room.clients.size} client(s)`);
			});
		}
	}, 30000); // Log toutes les 30 secondes

	return server;
}
