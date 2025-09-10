import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import {
	readSyncMessage,
	writeSyncStep1,
	writeSyncStep2,
	writeUpdate,
} from "y-protocols/sync.js";
import {
	Awareness,
	applyAwarenessUpdate,
	encodeAwarenessUpdate,
} from "y-protocols/awareness.js";
import { encodeStateAsUpdate, applyUpdate } from "yjs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// -----------------------------------------------------------------------------
// DATABASE
// -----------------------------------------------------------------------------
if (process.env.MONGO_URI) {
	mongoose
		.connect(process.env.MONGO_URI)
		.then(() => console.log("✅ MongoDB connecté"))
		.catch((err) => console.error("❌ Erreur MongoDB:", err));
}

// -----------------------------------------------------------------------------
// ROUTES API EXISTANTES
// -----------------------------------------------------------------------------
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/hello", (req, res) => {
	res.json({ message: "Hello depuis l'API backend 🚀" });
});

// -----------------------------------------------------------------------------
// FRONTEND BUILD (Vite React)
// -----------------------------------------------------------------------------
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

// -----------------------------------------------------------------------------
// YJS DOCS EN MÉMOIRE
// -----------------------------------------------------------------------------
const docs = new Map(); // roomId -> { ydoc, awareness, clients }

function getYDoc(roomId) {
	if (!docs.has(roomId)) {
		const ydoc = new Y.Doc();
		const awareness = new Awareness(ydoc);
		const clients = new Set();
		docs.set(roomId, { ydoc, awareness, clients });
	}
	return docs.get(roomId);
}

// -----------------------------------------------------------------------------
// REIMPLEMENTATION setupWSConnection
// -----------------------------------------------------------------------------
function setupWSConnection(ws, req) {
	const roomId = req.url.slice(1) || "default";
	const { ydoc, awareness, clients } = getYDoc(roomId);

	clients.add(ws);

	// 1️⃣ Envoi de l’état initial (sync protocole)
	ws.send(writeSyncStep1(ydoc));

	// 2️⃣ Envoi de l’état awareness (qui est connecté ? curseurs ?)
	ws.send(
		encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
	);

	// Gestion des messages entrants
	ws.on("message", (msg) => {
		const data = new Uint8Array(msg);

		// On lit le premier byte → type de message
		const messageType = data[0];

		switch (messageType) {
			case 0: // sync step 1/2/update
				readSyncMessage(data, ws, (update) => {
					applyUpdate(ydoc, update);
					// Broadcast aux autres clients
					clients.forEach((client) => {
						if (client !== ws && client.readyState === 1) {
							client.send(writeUpdate(update));
						}
					});
				});
				break;

			case 1: // awareness update
				applyAwarenessUpdate(awareness, data, ws);
				clients.forEach((client) => {
					if (client !== ws && client.readyState === 1) {
						client.send(data);
					}
				});
				break;

			default:
				console.warn("⚠️ Message Yjs inconnu:", messageType);
		}
	});

	ws.on("close", () => {
		clients.delete(ws);
		awareness.removeAwarenessStates([ws], null);

		if (clients.size === 0) {
			docs.delete(roomId); // cleanup
		}
	});
}

// -----------------------------------------------------------------------------
// CREATION DU SERVEUR HTTP + WS
// -----------------------------------------------------------------------------
const server = http.createServer(app);

const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => setupWSConnection(ws, req));

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------
server.listen(PORT, () => {
	console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
	console.log(`🔗 WebSocket Yjs prêt sur ws://localhost:${PORT}/:roomId`);
});
