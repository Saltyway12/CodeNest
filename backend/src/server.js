// backend/src/server.js
import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/dist/server.js"; // ✅ pas de bin
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// CONFIG DE BASE
// -----------------------------------------------------------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// -----------------------------------------------------------------------------
// DATABASE (si tu utilisais MongoDB avec Mongoose)
// -----------------------------------------------------------------------------
if (process.env.MONGO_URI) {
	mongoose
		.connect(process.env.MONGO_URI)
		.then(() => console.log("✅ MongoDB connecté"))
		.catch((err) => console.error("❌ Erreur MongoDB:", err));
}

// -----------------------------------------------------------------------------
// TES ROUTES EXISTANTES
// -----------------------------------------------------------------------------
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
// ajoute ici les autres si besoin

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/hello", (req, res) => {
	res.json({ message: "Hello depuis l'API backend 🚀" });
});

// -----------------------------------------------------------------------------
// SERVE FRONTEND (build Vite React dans /frontend/dist)
// -----------------------------------------------------------------------------
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

// -----------------------------------------------------------------------------
// CREATION DU SERVEUR HTTP + WS
// -----------------------------------------------------------------------------
const server = http.createServer(app);

// Yjs WebSocket server
const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => {
	setupWSConnection(ws, req); // ✅ synchronisation temps réel
});

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------
server.listen(PORT, () => {
	console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
	console.log(`🔗 WebSocket Yjs prêt sur ws://localhost:${PORT}`);
});
