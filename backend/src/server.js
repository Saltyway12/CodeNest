import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";

// Routes API
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Middleware
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Servir frontend en production
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
	});
}

// --------------------
// Serveur HTTP
// --------------------
const server = http.createServer(app);

// --------------------
// Serveur WebSocket Y.js amélioré
// --------------------
const rooms = new Map();

function getRoom(roomName) {
	if (!rooms.has(roomName)) {
		const room = {
			doc: new Y.Doc(),
			clients: new Set(),
			lastUpdate: Date.now(),
			updateHistory: [], // Pour tracking des updates
			messageQueue: [], // Queue pour traitement séquentiel
			processingQueue: false,
		};

		rooms.set(roomName, room);
		console.log(`🏠 New room created: ${roomName}`);
	}

	const room = rooms.get(roomName);
	room.lastUpdate = Date.now(); // Mettre à jour le timestamp d'activité
	return room;
}

// Traitement séquentiel des messages par room
async function processRoomQueue(room, roomName) {
	if (room.processingQueue) return;
	room.processingQueue = true;

	try {
		while (room.messageQueue.length > 0) {
			const queueItem = room.messageQueue.shift();
			await handleRoomMessage(room, roomName, queueItem);

			// Petite pause pour éviter de bloquer
			await new Promise((resolve) => setTimeout(resolve, 1));
		}
	} catch (error) {
		console.error(`❌ Error processing room queue for ${roomName}:`, error);
	} finally {
		room.processingQueue = false;
	}
}

async function handleRoomMessage(room, roomName, { ws, message, rawData }) {
	try {
		switch (message.type) {
			case "sync-step-1": {
				console.log(`📤 Sync step 1 for room ${roomName}`);

				// Décoder la state vector du client
				const stateVector = new Uint8Array(message.stateVector);

				// Calculer la différence avec l'état actuel
				const diff = Y.encodeStateAsUpdate(room.doc, stateVector);

				if (diff.length > 0) {
					const response = {
						type: "sync-step-2",
						update: Array.from(diff),
						timestamp: Date.now(),
						serverId: "server",
					};

					if (ws.readyState === ws.OPEN) {
						ws.send(JSON.stringify(response));
						console.log(`✅ Sent sync-step-2 to client (${diff.length} bytes)`);
					}
				} else {
					console.log(`ℹ️ Client already synced for room ${roomName}`);
				}
				break;
			}

			case "doc-update": {
				console.log(`📝 Processing document update for room ${roomName}`);

				const update = new Uint8Array(message.update);
				const updateHash = message.hash || generateUpdateHash(update);

				// Vérifier si on a déjà traité cette update (éviter les doublons)
				const isDuplicate = room.updateHistory.some(
					(h) => h.hash === updateHash && Date.now() - h.timestamp < 5000
				);

				if (isDuplicate) {
					console.log(
						`🔄 Duplicate update detected for room ${roomName}, skipping`
					);
					break;
				}

				// Valider l'update avant de l'appliquer
				if (!isValidUpdate(room.doc, update)) {
					console.warn(`⚠️ Invalid update received for room ${roomName}`);
					break;
				}

				try {
					// Appliquer l'update de manière transactionnelle
					room.doc.transact(() => {
						Y.applyUpdate(room.doc, update, `server-${roomName}`);
					});

					// Ajouter à l'historique
					room.updateHistory.push({
						hash: updateHash,
						timestamp: Date.now(),
						clientId: message.clientId,
					});

					// Limiter la taille de l'historique
					if (room.updateHistory.length > 100) {
						room.updateHistory = room.updateHistory.slice(-50);
					}

					console.log(`✅ Update applied to room ${roomName}`);

					// Propager aux autres clients
					const propagationMessage = JSON.stringify({
						...message,
						serverId: "server",
						propagatedAt: Date.now(),
					});

					let propagatedCount = 0;
					room.clients.forEach((client) => {
						if (client !== ws && client.readyState === client.OPEN) {
							try {
								client.send(propagationMessage);
								propagatedCount++;
							} catch (error) {
								console.error(`❌ Error sending to client:`, error);
								// Marquer le client pour suppression
								client.shouldRemove = true;
							}
						}
					});

					console.log(`📡 Update propagated to ${propagatedCount} clients`);
				} catch (error) {
					console.error(`❌ Error applying update to room ${roomName}:`, error);

					// Envoyer une demande de resync au client défaillant
					if (ws.readyState === ws.OPEN) {
						ws.send(
							JSON.stringify({
								type: "resync-request",
								timestamp: Date.now(),
							})
						);
					}
				}
				break;
			}

			case "awareness-update": {
				console.log(`👁️ Processing awareness update for room ${roomName}`);

				// Propager directement les awareness updates (pas besoin de les appliquer au doc)
				const awarenessMessage = JSON.stringify({
					...message,
					serverId: "server",
					propagatedAt: Date.now(),
				});

				let propagatedCount = 0;
				room.clients.forEach((client) => {
					if (client !== ws && client.readyState === client.OPEN) {
						try {
							client.send(awarenessMessage);
							propagatedCount++;
						} catch (error) {
							console.error(`❌ Error sending awareness to client:`, error);
							client.shouldRemove = true;
						}
					}
				});

				console.log(
					`👁️ Awareness update propagated to ${propagatedCount} clients`
				);
				break;
			}

			default:
				console.warn(
					`⚠️ Unknown message type: ${message.type} for room ${roomName}`
				);
		}
	} catch (error) {
		console.error(`❌ Error handling message for room ${roomName}:`, error);
	}
}

function generateUpdateHash(update) {
	let hash = 0;
	for (let i = 0; i < Math.min(update.length, 1000); i++) {
		const char = update[i];
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString();
}

function isValidUpdate(doc, update) {
	try {
		// Créer un document de test
		const testDoc = new Y.Doc();

		// Appliquer l'état actuel
		const currentState = Y.encodeStateAsUpdate(doc);
		Y.applyUpdate(testDoc, currentState);

		// Tester la nouvelle update
		Y.applyUpdate(testDoc, update);

		// Vérifier la cohérence
		const finalState = Y.encodeStateAsUpdate(testDoc);
		testDoc.destroy();

		return finalState.length > 0;
	} catch (error) {
		console.warn(`⚠️ Update validation failed:`, error.message);
		return false;
	}
}

// --------------------
// Configuration WebSocket
// --------------------
const wss = new WebSocketServer({
	server,
	clientTracking: true,
	perMessageDeflate: {
		// Compression pour réduire la bande passante
		threshold: 1024,
		concurrencyLimit: 10,
		memLevel: 7,
	},
});

wss.on("connection", (ws, req) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const roomName = url.searchParams.get("room");

	if (!roomName) {
		ws.close(1002, "Room name required");
		return;
	}

	const room = getRoom(roomName);
	room.clients.add(ws);
	ws.roomName = roomName;
	ws.clientId = Math.random().toString(36).substr(2, 9);
	ws.joinedAt = Date.now();

	console.log(
		`✅ Client ${ws.clientId} connected to room: ${roomName}. Total: ${room.clients.size}`
	);

	// Envoyer l'état initial au nouveau client
	const currentState = Y.encodeStateAsUpdate(room.doc);
	if (currentState.length > 0) {
		const initMessage = {
			type: "sync-step-2",
			update: Array.from(currentState),
			timestamp: Date.now(),
			serverId: "server",
		};

		try {
			ws.send(JSON.stringify(initMessage));
			console.log(
				`📤 Sent initial state to client ${ws.clientId} (${currentState.length} bytes)`
			);
		} catch (error) {
			console.error(`❌ Error sending initial state:`, error);
		}
	}

	ws.on("message", (data) => {
		try {
			// Parsing JSON avec gestion d'erreur
			const message = JSON.parse(data.toString());

			// Ajouter le message à la queue de traitement de la room
			room.messageQueue.push({ ws, message, rawData: data });
			processRoomQueue(room, roomName);
		} catch (parseError) {
			// Fallback: traitement en mode binaire (compatibilité)
			console.log(`📦 Processing binary message for room ${roomName}`);

			try {
				const update = new Uint8Array(data);

				if (isValidUpdate(room.doc, update)) {
					room.doc.transact(() => {
						Y.applyUpdate(room.doc, update, `server-${roomName}`);
					});

					// Broadcast en mode binaire
					room.clients.forEach((client) => {
						if (client !== ws && client.readyState === client.OPEN) {
							try {
								client.send(update);
							} catch (error) {
								client.shouldRemove = true;
							}
						}
					});
				}
			} catch (binaryError) {
				console.error(`❌ Error processing binary message:`, binaryError);
			}
		}
	});

	ws.on("close", (code, reason) => {
		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
			console.log(
				`❌ Client ${ws.clientId} disconnected from room ${ws.roomName} (${code}: ${reason}). Remaining: ${room.clients.size}`
			);

			// Nettoyer la room si vide
			if (room.clients.size === 0) {
				// Garder la room pendant 5 minutes au cas où quelqu'un revient
				setTimeout(() => {
					const currentRoom = rooms.get(ws.roomName);
					if (currentRoom && currentRoom.clients.size === 0) {
						rooms.delete(ws.roomName);
						console.log(
							`🧹 Room ${ws.roomName} cleaned up (empty for 5 minutes)`
						);
					}
				}, 5 * 60 * 1000);
			}
		}
	});

	ws.on("error", (error) => {
		console.error(
			`💥 WebSocket error for client ${ws.clientId} in room ${ws.roomName}:`,
			error
		);

		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
		}
	});

	// Ping périodique pour maintenir la connexion
	const pingInterval = setInterval(() => {
		if (ws.readyState === ws.OPEN) {
			ws.ping();
		} else {
			clearInterval(pingInterval);
		}
	}, 30000);

	ws.on("pong", () => {
		ws.lastPong = Date.now();
	});
});

// --------------------
// Nettoyage et maintenance
// --------------------

// Nettoyage des clients déconnectés
setInterval(() => {
	rooms.forEach((room, roomName) => {
		const clientsToRemove = [];

		room.clients.forEach((client) => {
			if (client.shouldRemove || client.readyState !== client.OPEN) {
				clientsToRemove.push(client);
			}
		});

		clientsToRemove.forEach((client) => {
			room.clients.delete(client);
		});

		if (clientsToRemove.length > 0) {
			console.log(
				`🧹 Removed ${clientsToRemove.length} disconnected clients from room ${roomName}`
			);
		}
	});
}, 60000); // Toutes les minutes

// Nettoyage des rooms inactives
setInterval(() => {
	const now = Date.now();
	const inactiveRooms = [];

	rooms.forEach((room, roomName) => {
		// Room inactive depuis plus de 30 minutes et vide
		if (room.clients.size === 0 && now - room.lastUpdate > 30 * 60 * 1000) {
			inactiveRooms.push(roomName);
		}
	});

	inactiveRooms.forEach((roomName) => {
		rooms.delete(roomName);
	});

	if (inactiveRooms.length > 0) {
		console.log(`🧽 Cleaned ${inactiveRooms.length} inactive rooms`);
	}
}, 15 * 60 * 1000); // Toutes les 15 minutes

// Statistiques détaillées en mode développement
if (process.env.NODE_ENV === "development") {
	setInterval(() => {
		console.log(`📊 === STATISTIQUES SERVEUR Y.js ===`);
		console.log(`🏠 Rooms actives: ${rooms.size}`);

		let totalClients = 0;
		rooms.forEach((room, roomName) => {
			totalClients += room.clients.size;
			console.log(
				`  📁 ${roomName}: ${
					room.clients.size
				} clients, dernière activité: ${new Date(
					room.lastUpdate
				).toLocaleTimeString()}`
			);

			// Détails des clients si moins de 10
			if (room.clients.size < 10) {
				room.clients.forEach((client) => {
					const uptime = Math.round((Date.now() - client.joinedAt) / 1000);
					console.log(
						`    👤 Client ${client.clientId}: connecté depuis ${uptime}s`
					);
				});
			}
		});

		console.log(`👥 Total clients connectés: ${totalClients}`);
		console.log(
			`💾 Mémoire utilisée: ${Math.round(
				process.memoryUsage().heapUsed / 1024 / 1024
			)}MB`
		);
		console.log(`⏱️ Uptime serveur: ${Math.round(process.uptime() / 60)}min`);
		console.log(`================================\n`);
	}, 2 * 60 * 1000); // Toutes les 2 minutes
}

// Health check endpoint
app.get("/health", (req, res) => {
	const stats = {
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		rooms: {
			active: rooms.size,
			totalClients: Array.from(rooms.values()).reduce(
				(sum, room) => sum + room.clients.size,
				0
			),
		},
	};

	res.json(stats);
});

// API pour obtenir les statistiques des rooms
app.get("/api/rooms/stats", (req, res) => {
	const stats = [];

	rooms.forEach((room, roomName) => {
		stats.push({
			name: roomName,
			clients: room.clients.size,
			lastUpdate: room.lastUpdate,
			documentSize: Y.encodeStateAsUpdate(room.doc).length,
			messageQueueSize: room.messageQueue.length,
		});
	});

	res.json(stats);
});

// --------------------
// Lancement serveur
// --------------------
server.listen(PORT, () => {
	console.log(`🚀 === SERVEUR Y.js COLLABORATIF DÉMARRÉ ===`);
	console.log(`📡 HTTP Server: http://localhost:${PORT}`);
	console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}?room=<room-name>`);
	console.log(`🏥 Health check: http://localhost:${PORT}/health`);
	console.log(`📊 Room stats: http://localhost:${PORT}/api/rooms/stats`);
	console.log(`🛠️  Mode: ${process.env.NODE_ENV || "development"}`);
	console.log(`===============================================\n`);

	connectDB();
});

// --------------------
// Gestion propre de l'arrêt du serveur
// --------------------
function gracefulShutdown(signal) {
	console.log(`\n🛑 Arrêt du serveur (${signal})...`);

	// Fermer toutes les connexions WebSocket proprement
	wss.clients.forEach((ws) => {
		if (ws.readyState === ws.OPEN) {
			ws.send(
				JSON.stringify({
					type: "server-shutdown",
					message: "Serveur en cours d'arrêt",
					timestamp: Date.now(),
				})
			);
			ws.close(1001, "Server shutting down");
		}
	});

	// Sauvegarder l'état des documents si nécessaire
	if (process.env.NODE_ENV === "production") {
		console.log(`💾 Sauvegarde de ${rooms.size} room(s)...`);
		// Ici vous pourriez sauvegarder l'état des documents en base de données
		rooms.forEach((room, roomName) => {
			const state = Y.encodeStateAsUpdate(room.doc);
			console.log(`  💾 Room ${roomName}: ${state.length} bytes`);
			// Exemple: saveRoomState(roomName, state);
		});
	}

	// Fermer le serveur WebSocket
	wss.close(() => {
		console.log("✅ WebSocket server fermé");

		// Fermer le serveur HTTP
		server.close(() => {
			console.log("✅ HTTP server fermé");
			console.log("👋 Serveur arrêté proprement");
			process.exit(0);
		});
	});

	// Force quit après 10 secondes si ça ne répond plus
	setTimeout(() => {
		console.error("⚠️  Arrêt forcé (timeout)");
		process.exit(1);
	}, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Gestion des erreurs non gérées
process.on("uncaughtException", (error) => {
	console.error("💥 Erreur non gérée:", error);
	gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("💥 Promesse rejetée non gérée:", reason);
	console.error("   Promise:", promise);
});

export default server;
