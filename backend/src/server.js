// server.js - Partie WebSocket améliorée
import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Middleware et routes
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import { connectDB } from "./lib/db.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

const server = http.createServer(app);

// --------------------
// Serveur WebSocket Y.js amélioré
// --------------------
const rooms = new Map();

function getRoom(roomName) {
	if (!rooms.has(roomName)) {
		const doc = new Y.Doc();
		rooms.set(roomName, {
			doc,
			clients: new Set(),
			lastUpdate: Date.now(),
			updateHistory: [], // Garder un historique des dernières updates
		});
	}
	return rooms.get(roomName);
}

const wss = new WebSocketServer({
	server,
	clientTracking: true,
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

	console.log(
		`✅ Client connecté à la room: ${roomName}. Total: ${room.clients.size}`
	);

	// Synchronisation initiale robuste
	const sendInitialSync = () => {
		const stateVector = Y.encodeStateVector(room.doc);
		const update = Y.encodeStateAsUpdate(room.doc, stateVector);

		if (update.length > 0) {
			ws.send(
				JSON.stringify({
					type: "sync-step-2",
					update: Array.from(update),
					timestamp: Date.now(),
				})
			);
		}
	};

	// Envoyer sync initial après un court délai
	setTimeout(sendInitialSync, 100);

	ws.on("message", async (data) => {
		try {
			const message = JSON.parse(data.toString());

			switch (message.type) {
				case "sync-step-1":
					console.log(`🔄 Sync step 1 pour room ${roomName}`);

					// Utiliser le protocole Y.js standard
					const stateVector = new Uint8Array(message.stateVector);
					const decoder = new syncProtocol.Decoder(stateVector);
					const encoder = new syncProtocol.Encoder();

					try {
						const messageType = syncProtocol.readVarUint(decoder);
						if (messageType === syncProtocol.messageYjsSyncStep1) {
							syncProtocol.readSyncStep1(decoder, encoder, room.doc);

							if (encoder.length > 0) {
								ws.send(
									JSON.stringify({
										type: "sync-step-2",
										update: Array.from(encoder.toUint8Array()),
										timestamp: Date.now(),
									})
								);
							}
						}
					} catch (e) {
						console.error("Erreur sync step 1:", e);
						// Fallback: envoyer l'état complet
						sendInitialSync();
					}
					break;

				case "doc-update":
					console.log(`📝 Document update pour room ${roomName}`);

					const update = new Uint8Array(message.update);
					const timestamp = message.timestamp || Date.now();

					// Vérifier que l'update est plus récent
					if (timestamp >= room.lastUpdate - 1000) {
						// Tolérance de 1s
						try {
							// Appliquer l'update de manière transactionnelle
							room.doc.transact(() => {
								Y.applyUpdate(room.doc, update);
							});

							room.lastUpdate = Math.max(room.lastUpdate, timestamp);

							// Garder un historique des updates récentes
							room.updateHistory.push({
								update: Array.from(update),
								timestamp,
								clientId: ws.id || "unknown",
							});

							// Nettoyer l'historique (garder seulement les 10 dernières)
							if (room.updateHistory.length > 10) {
								room.updateHistory = room.updateHistory.slice(-10);
							}

							// Propager avec délai pour éviter les conflits
							setTimeout(() => {
								const updateMessage = JSON.stringify({
									...message,
									serverTimestamp: Date.now(),
								});

								room.clients.forEach((client) => {
									if (client !== ws && client.readyState === ws.OPEN) {
										client.send(updateMessage);
									}
								});
							}, 10); // Petit délai pour la propagation
						} catch (error) {
							console.error("Erreur application update:", error);
							// Renvoyer l'état correct au client
							sendInitialSync();
						}
					} else {
						console.warn("Update ignoré (timestamp trop ancien)");
					}
					break;

				case "awareness-update":
					// Propager immédiatement les updates d'awareness
					const awarenessMessage = JSON.stringify({
						...message,
						serverTimestamp: Date.now(),
					});

					room.clients.forEach((client) => {
						if (client !== ws && client.readyState === ws.OPEN) {
							client.send(awarenessMessage);
						}
					});
					break;

				default:
					console.warn(`⚠️ Type de message inconnu: ${message.type}`);
			}
		} catch (e) {
			console.error("Erreur traitement message:", e);
		}
	});

	ws.on("close", () => {
		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
			console.log(
				`❌ Client déconnecté de ${ws.roomName}. Restants: ${room.clients.size}`
			);

			if (room.clients.size === 0) {
				// Garder la room pendant 5 minutes après le dernier client
				setTimeout(() => {
					const currentRoom = rooms.get(ws.roomName);
					if (currentRoom && currentRoom.clients.size === 0) {
						rooms.delete(ws.roomName);
						console.log(`🧹 Room ${ws.roomName} supprimée après timeout`);
					}
				}, 300000); // 5 minutes
			}
		}
	});

	ws.on("error", (error) => {
		console.error(`💥 Erreur WebSocket:`, error);
		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
		}
	});
});

// Nettoyage périodique plus intelligent
setInterval(() => {
	let totalRooms = rooms.size;
	let cleanedRooms = 0;

	rooms.forEach((room, roomName) => {
		if (room.clients.size === 0) {
			// Supprimer les rooms inactives depuis plus de 10 minutes
			if (Date.now() - room.lastUpdate > 600000) {
				rooms.delete(roomName);
				cleanedRooms++;
			}
		}
	});

	if (cleanedRooms > 0 || totalRooms > 0) {
		console.log(
			`🧽 Nettoyage: ${cleanedRooms}/${totalRooms} room(s) supprimée(s)`
		);
	}
}, 300000);

server.listen(PORT, () => {
	console.log(`✅ Serveur HTTP + WebSocket Y.js en écoute sur le port ${PORT}`);
	// connectDB();
});
