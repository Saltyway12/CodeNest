import express from "express";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import * as Y from "yjs";
import {
	readSyncMessage,
	writeSyncStep1,
	writeUpdate,
} from "y-protocols/sync.js";
import {
	Awareness,
	applyAwarenessUpdate,
	encodeAwarenessUpdate,
} from "y-protocols/awareness.js";
import { WebSocketServer } from "ws";
import { connectDB } from "./lib/db.js";

// -------------------------
// Config et Express
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// -------------------------
// Routes API
// -------------------------
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/hello", (req, res) => {
	res.json({ message: "Hello depuis l'API backend 🚀" });
});

// -------------------------
// Frontend build (React)
// -------------------------
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

// -------------------------
// Yjs : stockage en mémoire
// -------------------------
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

// -------------------------
// Gestion WebSocket
// -------------------------
function setupWSConnection(ws, req) {
	const roomId = req.url.slice(1) || "default"; // /:roomId
	const { ydoc, awareness, clients } = getYDoc(roomId);

	clients.add(ws);

	// 1️⃣ Envoyer état initial du document
	ws.send(writeSyncStep1(ydoc));

	// 2️⃣ Envoyer état awareness (qui est connecté, curseurs…)
	ws.send(
		encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
	);

	// Gestion messages entrants
	ws.on("message", (msg) => {
		const data = new Uint8Array(msg);
		const messageType = data[0];

		switch (messageType) {
			case 0: // sync update
				readSyncMessage(data, ws, (update) => {
					Y.applyUpdate(ydoc, update);

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

// -------------------------
// Serveur HTTP + WS
// -------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => setupWSConnection(ws, req));

// -------------------------
// Lancement serveur avec DB
// -------------------------
connectDB().then(() => {
	server.listen(PORT, () => {
		console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
		console.log(`🔗 WebSocket Yjs prêt sur ws://localhost:${PORT}/:roomId`);
	});
});
