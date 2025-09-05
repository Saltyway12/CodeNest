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
		origin: "http://localhost:5173", // À remplacer par ton frontend prod
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
// Serveur WebSocket Y.js avec gestion des rooms
// --------------------
const rooms = new Map(); // Stocker les rooms avec leurs clients et documents

function getRoom(roomName) {
	if (!rooms.has(roomName)) {
		rooms.set(roomName, {
			doc: new Y.Doc(),
			clients: new Set(),
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

	// Associer la room au WebSocket pour le nettoyage
	ws.roomName = roomName;

	console.log(
		`✅ Client connecté à la room: ${roomName}. Total clients: ${room.clients.size}`
	);

	// Envoyer l'état actuel du document au nouveau client
	const currentState = Y.encodeStateAsUpdate(room.doc);
	if (currentState.length > 0) {
		ws.send(
			JSON.stringify({
				type: "sync-step-2",
				update: Array.from(currentState),
			})
		);
	}

	ws.on("message", (data) => {
		try {
			// Essayer de parser comme JSON (nouveau protocole)
			const message = JSON.parse(data.toString());

			switch (message.type) {
				case "sync-step-1":
					// Client demande la synchronisation initiale
					console.log(`🔄 Sync step 1 pour room ${roomName}`);
					const stateVector = new Uint8Array(message.stateVector);
					const diff = Y.encodeStateAsUpdate(room.doc, stateVector);

					if (diff.length > 0) {
						ws.send(
							JSON.stringify({
								type: "sync-step-2",
								update: Array.from(diff),
							})
						);
					}
					break;

				case "doc-update":
					// Appliquer l'update au document de la room
					console.log(`📝 Document update pour room ${roomName}`);
					const update = new Uint8Array(message.update);
					Y.applyUpdate(room.doc, update);

					// Propager à tous les autres clients de la room
					const updateMessage = JSON.stringify(message);
					room.clients.forEach((client) => {
						if (client !== ws && client.readyState === ws.OPEN) {
							client.send(updateMessage);
						}
					});
					break;

				case "awareness-update":
					// Propager les updates d'awareness (curseurs, sélections)
					console.log(`👁️ Awareness update pour room ${roomName}`);
					const awarenessMessage = JSON.stringify(message);
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
			// Fallback: traiter comme update binaire (ancien protocole)
			console.log(`📦 Message binaire reçu pour room ${roomName}`);
			try {
				const update = new Uint8Array(data);
				Y.applyUpdate(room.doc, update);

				// Broadcast aux autres clients de la même room
				room.clients.forEach((client) => {
					if (client !== ws && client.readyState === ws.OPEN) {
						client.send(update);
					}
				});
			} catch (err) {
				console.error("❌ Erreur traitement message binaire:", err);
			}
		}
	});

	ws.on("close", () => {
		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
			console.log(
				`❌ Client déconnecté de la room ${ws.roomName}. Clients restants: ${room.clients.size}`
			);

			// Nettoyer la room si elle est vide
			if (room.clients.size === 0) {
				rooms.delete(ws.roomName);
				console.log(`🧹 Room ${ws.roomName} supprimée (vide)`);
			}
		}
	});

	ws.on("error", (error) => {
		console.error(`💥 Erreur WebSocket dans room ${ws.roomName}:`, error);
		const room = rooms.get(ws.roomName);
		if (room) {
			room.clients.delete(ws);
		}
	});
});

// Nettoyage périodique des rooms vides et anciennes
setInterval(() => {
	let cleanedRooms = 0;
	rooms.forEach((room, roomName) => {
		if (room.clients.size === 0) {
			rooms.delete(roomName);
			cleanedRooms++;
		}
	});

	if (cleanedRooms > 0) {
		console.log(`🧽 Nettoyage: ${cleanedRooms} room(s) vide(s) supprimée(s)`);
	}
}, 300000); // Toutes les 5 minutes

// Statistiques des rooms (optionnel, pour debug)
if (process.env.NODE_ENV === "development") {
	setInterval(() => {
		console.log(`📊 Statistiques: ${rooms.size} room(s) active(s)`);
		rooms.forEach((room, roomName) => {
			console.log(`  - ${roomName}: ${room.clients.size} client(s)`);
		});
	}, 60000); // Toutes les minutes
}

// --------------------
// Lancement serveur
// --------------------
server.listen(PORT, () => {
	console.log(`✅ Serveur HTTP + WebSocket Y.js en écoute sur le port ${PORT}`);
	console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}?room=<room-name>`);
	connectDB();
});

// Gestion propre de l'arrêt du serveur
process.on("SIGTERM", () => {
	console.log("🛑 Arrêt du serveur...");
	wss.close(() => {
		server.close(() => {
			console.log("✅ Serveur arrêté proprement");
			process.exit(0);
		});
	});
});

process.on("SIGINT", () => {
	console.log("🛑 Arrêt du serveur (Ctrl+C)...");
	wss.close(() => {
		server.close(() => {
			console.log("✅ Serveur arrêté proprement");
			process.exit(0);
		});
	});
});
