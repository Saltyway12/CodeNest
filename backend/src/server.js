import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { WebSocketServer } from "ws";
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
import "dotenv/config";

// 🔹 Routes et DB
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js"; // si tu l’as
// --------------------
// CONFIG EXPRESS
// --------------------
const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --------------------
// ROUTES API
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes || ((req, res) => res.sendStatus(404))); // fallback
app.get("/api/hello", (req, res) =>
	res.json({ message: "Hello depuis l'API backend 🚀" })
);

// --------------------
// FRONTEND BUILD
// --------------------
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

// --------------------
// YJS DOCS EN MÉMOIRE
// --------------------
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

// --------------------
// WS SETUP
// --------------------
function setupWSConnection(ws, req) {
	// url: /room-id
	const roomId = req.url.slice(1) || "default";
	const { ydoc, awareness, clients } = getYDoc(roomId);
	clients.add(ws);

	// 1️⃣ sync step 1 → envoyer état initial
	ws.send(writeSyncStep1(ydoc));

	// 2️⃣ envoyer awareness
	ws.send(
		encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
	);

	// 3️⃣ messages entrants
	ws.on("message", (msg) => {
		const data = new Uint8Array(msg);
		const type = data[0];

		switch (type) {
			case 0: // sync update
				readSyncMessage(data, ws, (update) => {
					Y.applyUpdate(ydoc, update);
					// broadcast aux autres
					clients.forEach((client) => {
						if (client !== ws && client.readyState === 1) {
							client.send(writeUpdate(update));
						}
					});
				});
				break;
			case 1: // awareness
				applyAwarenessUpdate(awareness, data, ws);
				clients.forEach((client) => {
					if (client !== ws && client.readyState === 1) {
						client.send(data);
					}
				});
				break;
			default:
				console.warn("⚠️ Message Yjs inconnu:", type);
		}
	});

	ws.on("close", () => {
		clients.delete(ws);
		awareness.removeAwarenessStates([ws], null);
		if (clients.size === 0) docs.delete(roomId);
	});
}

// --------------------
// CREATION SERVEUR HTTP + WS
// --------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => setupWSConnection(ws, req));

// --------------------
// DEMARRAGE
// --------------------
server.listen(PORT, "0.0.0.0", async () => {
	console.log(`🚀 Serveur démarré sur http://0.0.0.0:${PORT}`);
	console.log(`🔗 WebSocket Yjs prêt sur ws://0.0.0.0:${PORT}/:roomId`);
	await connectDB();
});
