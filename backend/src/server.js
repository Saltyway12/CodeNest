// server.js
import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http"; // 🔹 nécessaire pour combiner HTTP + WS
import { WebSocketServer } from "ws"; // 🔹 WebSocket natif
import setupWSConnection from "y-websocket/bin/utils.js"; // 🔹 Y.js utilitaire

// Routes API existantes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// 🔹 Middleware CORS : adapte l’origin quand tu passeras en prod
app.use(
	cors({
		origin: "http://localhost:5173", // 👉 à remplacer par ton frontend en production
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// 🔹 Routes API classiques
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// 🔹 Si on est en production → servir le frontend buildé
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
	});
}

// --------------------
// 🔹 Création du serveur HTTP
// --------------------
const server = http.createServer(app);

// --------------------
// 🔹 Ajout WebSocket Y.js
// --------------------
const wss = new WebSocketServer({ server });

// Chaque client WebSocket qui se connecte est pris en charge par Y.js
wss.on("connection", (ws, req) => {
	// setupWSConnection lie ce socket à un "document" Y.js partagé
	// L’URL du client contient le "room name" (= identifiant de doc)
	setupWSConnection(ws, req);
});

// --------------------
// 🔹 Lancement du serveur
// --------------------
server.listen(PORT, () => {
	console.log(`✅ Serveur HTTP + Y-WebSocket en écoute sur le port ${PORT}`);
	connectDB();
});
