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
	try {
		const initialMessage = {
			type: "INITIAL_CONTENT",
			content: room.content,
			timestamp: Date.now(),
		};
		ws.send(JSON.stringify(initialMessage));
		console.log(
			`📤 Contenu initial envoyé à ${callId}:`,
			room.content.length,
			"caractères"
		);
	} catch (error) {
		console.error("❌ Erreur envoi contenu initial:", error);
	}

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
			console.log(`📨 Message reçu de ${callId}:`, message.type);

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

	// Validation des données
	if (!Array.isArray(changes)) {
		console.error("❌ Changes n'est pas un array:", changes);
		return;
	}

	if (changes.length === 0) {
		console.log("⚠️ Aucun changement à appliquer");
		return;
	}

	try {
		// Appliquer les changements au contenu de la room
		let content = room.content;

		// IMPORTANT: Trier les changements par offset décroissant
		// pour éviter que les modifications précédentes affectent les offsets suivants
		const sortedChanges = [...changes].sort(
			(a, b) => (b.rangeOffset || 0) - (a.rangeOffset || 0)
		);

		console.log(`🔄 Application de ${sortedChanges.length} changements`);

		for (const change of sortedChanges) {
			const rangeOffset = change.rangeOffset || 0;
			const rangeLength = change.rangeLength || 0;
			const text = change.text || "";

			// Vérifier que l'offset est valide
			if (rangeOffset < 0 || rangeOffset > content.length) {
				console.error(
					`❌ Offset invalide: ${rangeOffset}, contenu: ${content.length} caractères`
				);
				continue;
			}

			if (rangeOffset + rangeLength > content.length) {
				console.error(
					`❌ Range invalide: offset=${rangeOffset}, length=${rangeLength}, contenu: ${content.length} caractères`
				);
				continue;
			}

			// Appliquer le changement
			content =
				content.slice(0, rangeOffset) +
				text +
				content.slice(rangeOffset + rangeLength);

			console.log(
				`📝 Changement appliqué: offset=${rangeOffset}, length=${rangeLength}, text="${text.substring(
					0,
					50
				)}..."`
			);
		}

		room.content = content;
		console.log(`✅ Contenu mis à jour: ${content.length} caractères`);

		// Diffuser les changements aux autres clients
		// IMPORTANT: Renvoyer les changements originaux (non triés) pour préserver l'ordre Monaco
		const deltaMessage = {
			type: "DELTA_CHANGE",
			changes: changes, // Utiliser les changements originaux
			timestamp: Date.now(),
		};

		broadcastToRoom(callId, deltaMessage, senderWs);
		console.log(`📡 Delta diffusé à ${room.clients.size - 1} clients`);
	} catch (error) {
		console.error("❌ Erreur application delta:", error);
		console.error("❌ Changements problématiques:", changes);
		console.error("❌ Contenu actuel:", room.content.length, "caractères");
	}
}

// --------------------
// GESTION CURSEUR
// --------------------
function handleCursorPosition(callId, message, senderWs) {
	const cursorMessage = {
		type: "CURSOR_POSITION",
		userId: message.userId,
		position: message.position,
		color: message.color,
	};

	broadcastToRoom(callId, cursorMessage, senderWs);
}

// --------------------
// DIFFUSION DANS UNE ROOM
// --------------------
function broadcastToRoom(callId, message, excludeWs = null) {
	const room = rooms.get(callId);
	if (!room) {
		console.warn(`⚠️ Room ${callId} introuvable pour broadcast`);
		return;
	}

	const messageStr = JSON.stringify(message);
	let sentCount = 0;
	let failedCount = 0;

	room.clients.forEach((client) => {
		if (client !== excludeWs && client.readyState === 1) {
			// WebSocket.OPEN = 1
			try {
				client.send(messageStr);
				sentCount++;
			} catch (error) {
				console.error("❌ Erreur envoi message:", error);
				room.clients.delete(client);
				failedCount++;
			}
		}
	});

	if (sentCount > 0 || failedCount > 0) {
		console.log(
			`📡 Message diffusé: ${sentCount} succès, ${failedCount} échecs (room ${callId})`
		);
	}

	// Nettoyer les clients déconnectés
	if (failedCount > 0) {
		cleanupRoom(callId);
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
		try {
			// Extraire callId des query params
			const queryParams = url.parse(req.url, true).query;
			const callId = queryParams.callId;

			if (!callId) {
				console.error("❌ CallId manquant dans la connexion WebSocket");
				ws.close(1008, "CallId requis");
				return;
			}

			console.log(`🔌 Nouvelle connexion WebSocket pour room: ${callId}`);
			handleConnection(ws, callId);
		} catch (error) {
			console.error("❌ Erreur setup connexion WebSocket:", error);
			ws.close(1011, "Erreur serveur");
		}
	});

	wss.on("error", (error) => {
		console.error("❌ Erreur WebSocketServer:", error);
	});

	// Statistiques et nettoyage périodique
	setInterval(() => {
		if (rooms.size > 0) {
			console.log(`📊 Rooms actives: ${rooms.size}`);
			rooms.forEach((room, callId) => {
				console.log(
					`  - ${callId}: ${room.clients.size} client(s), ${room.content.length} chars`
				);

				// Nettoyer les clients fantômes (connexions fermées mais non supprimées)
				let cleanedClients = 0;
				room.clients.forEach((client) => {
					if (client.readyState !== 1) {
						// Pas OPEN
						room.clients.delete(client);
						cleanedClients++;
					}
				});

				if (cleanedClients > 0) {
					console.log(
						`🧹 ${cleanedClients} clients fantômes supprimés de ${callId}`
					);
				}
			});
		}

		// Nettoyer les rooms vides
		rooms.forEach((room, callId) => {
			if (room.clients.size === 0) {
				rooms.delete(callId);
				console.log(`🧹 Room vide supprimée: ${callId}`);
			}
		});
	}, 30000); // Toutes les 30 secondes

	return server;
}
