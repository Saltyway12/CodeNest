import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils.js";
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
		origin: "http://localhost:5173", // autorise ton frontend
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
// Serveur WebSocket Y.js officiel
// --------------------
const wss = new WebSocketServer({ server });

// Brancher chaque connexion à Y.js
wss.on("connection", (ws, req) => {
	// Exemple : ws://localhost:3000/myRoom
	const roomName = req.url.slice(1).split("?")[0] || "default";
	setupWSConnection(ws, req, { docName: roomName });
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
	});
});

// --------------------
// Lancement serveur
// --------------------
server.listen(PORT, () => {
	console.log(`🚀 === SERVEUR Y.js COLLABORATIF DÉMARRÉ ===`);
	console.log(`📡 HTTP Server: http://localhost:${PORT}`);
	console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/<room-name>`);
	console.log(`🏥 Health check: http://localhost:${PORT}/health`);
	console.log(`🛠️  Mode: ${process.env.NODE_ENV || "development"}`);
	console.log(`===============================================\n`);

	connectDB();
});

export default server;
