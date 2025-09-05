import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import http from "http"; // 👈 ajouté
import { WebSocketServer } from "ws"; // 👈 ajouté

// import des routes d'authentification
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
		origin: "http://localhost:5173", // ⚠️ mets ton vrai frontend Render en prod
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Production : servir le frontend buildé
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
	});
}

// 🔹 Création du serveur HTTP (au lieu de app.listen)
const server = http.createServer(app);

// 🔹 Ajout WebSocket
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
	console.log("🔗 Nouveau client WebSocket connecté");

	ws.send("Bienvenue sur le WebSocket serveur !");

	ws.on("message", (message) => {
		console.log("📩 Message reçu:", message.toString());
		ws.send(`Echo: ${message}`);
	});

	ws.on("close", () => {
		console.log("❌ Client déconnecté");
	});
});

// 🔹 Lancement serveur HTTP + WS
server.listen(PORT, () => {
	console.log(`✅ Serveur HTTP + WS en écoute sur le port ${PORT}`);
	connectDB();
});
