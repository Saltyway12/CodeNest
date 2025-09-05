// server.js
import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws"; // WebSocket natif
import * as Y from "yjs"; // Y.js pour les docs partagés

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
		origin: "http://localhost:5173", // à remplacer par ton frontend prod
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
// Serveur WebSocket Y.js
// --------------------
const docs = new Map(); // stocke les documents Y.js par "room"

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
	// Exemple simple : on récupère le nom de la room depuis l'URL
	const url = new URL(req.url, `http://${req.headers.host}`);
	const roomName = url.searchParams.get("room") || "default";

	// Récupérer ou créer le document Y.js pour cette room
	let doc = docs.get(roomName);
	if (!doc) {
		doc = new Y.Doc();
		docs.set(roomName, doc);
	}

	// Écoute des messages du client
	ws.on("message", (message) => {
		// Ici tu peux synchroniser doc selon ton protocole
		// Par exemple avec Y.encodeStateAsUpdate et Y.applyUpdate
		try {
			const update = new Uint8Array(message);
			Y.applyUpdate(doc, update);

			// Broadcast aux autres clients de la même room
			wss.clients.forEach((client) => {
				if (client !== ws && client.readyState === ws.OPEN) {
					client.send(update);
				}
			});
		} catch (err) {
			console.error("Erreur WebSocket Y.js:", err);
		}
	});

	ws.on("close", () => {
		console.log(`Client déconnecté de la room ${roomName}`);
	});
});

// --------------------
// Lancement serveur
// --------------------
server.listen(PORT, () => {
	console.log(`✅ Serveur HTTP + WebSocket en écoute sur le port ${PORT}`);
	connectDB();
});
