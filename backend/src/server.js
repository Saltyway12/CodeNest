import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";

// --------------------
// Routes API
// --------------------
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

// --------------------
// DB
// --------------------
import { connectDB } from "./lib/db.js";

// --------------------
// Config Express & Middleware
// --------------------
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(
	cors({
		origin: "http://localhost:5173", // changer si frontend sur autre domaine
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// --------------------
// Routes API
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// --------------------
// Servir frontend en production
// --------------------
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
	});
}

// --------------------
// Serveur HTTP + WebSocket
// --------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --------------------
// Gestion des rooms Yjs
// --------------------
const rooms = new Map();

function getRoom(roomName) {
	if (!rooms.has(roomName)) {
		rooms.set(roomName, {
			doc: new Y.Doc(),
			clients: new Set(),
			lastUpdate: Date.now(),
		});
		console.log(`🏠 New room created: ${roomName}`);
	}
	const room = rooms.get(roomName);
	room.lastUpdate = Date.now();
	return room;
}

function broadcast(room, sender, data) {
	room.clients.forEach((client) => {
		if (client !== sender && client.readyState === client.OPEN) {
			client.send(data);
		}
	});
}

// --------------------
// WebSocket
// --------------------
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
	ws.clientId = Math.random().toString(36).substring(2, 9);

	console.log(`✅ Client ${ws.clientId} connected to room: ${roomName}`);

	// Envoyer l'état initial du document
	const initState = Y.encodeStateAsUpdate(room.doc);
	if (initState.length > 0) {
		ws.send(
			JSON.stringify({ type: "sync-step-2", update: Array.from(initState) })
		);
	}

	// Messages entrants
	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString());

			switch (message.type) {
				case "sync-step-1": {
					const stateVector = new Uint8Array(message.stateVector);
					const update = Y.encodeStateAsUpdate(room.doc, stateVector);
					if (update.length > 0 && ws.readyState === ws.OPEN) {
						ws.send(
							JSON.stringify({
								type: "sync-step-2",
								update: Array.from(update),
							})
						);
					}
					break;
				}
				case "doc-update": {
					const update = new Uint8Array(message.update);
					try {
						room.doc.transact(() => {
							Y.applyUpdate(room.doc, update);
						});
						broadcast(room, ws, JSON.stringify(message));
					} catch (err) {
						console.error("❌ Error applying update:", err);
					}
					break;
				}
				case "awareness-update": {
					broadcast(room, ws, JSON.stringify(message));
					break;
				}
				default:
					console.warn("⚠️ Unknown message type:", message.type);
			}
		} catch (err) {
			console.error("❌ Failed to parse message:", err);
		}
	});

	ws.on("close", () => {
		room.clients.delete(ws);
		console.log(`❌ Client ${ws.clientId} disconnected from room ${roomName}`);
		if (room.clients.size === 0) {
			setTimeout(() => {
				const r = rooms.get(roomName);
				if (r && r.clients.size === 0) {
					rooms.delete(roomName);
					console.log(`🧹 Room ${roomName} cleaned (empty)`);
				}
			}, 5 * 60 * 1000);
		}
	});

	ws.on("error", (err) => {
		console.error("💥 WebSocket error:", err);
		room.clients.delete(ws);
	});
});

// --------------------
// Lancement serveur
// --------------------
server.listen(PORT, () => {
	console.log(`🚀 Backend running on http://localhost:${PORT}`);
	console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}?room=<room-name>`);
	connectDB();
});
