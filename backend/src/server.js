import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { setupWebSocketServer } from "./wsServer.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import { connectDB } from "./lib/db.js";

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT; // Port défini dans les variables d'environnement
const __dirname = path.resolve(); // Chemin absolu du répertoire du projet

// Configuration CORS pour autoriser les requêtes cross-origin
// Permet au frontend de communiquer avec le backend
app.use(
	cors({
		origin: "http://localhost:5173", // URL du serveur de développement Vite
		credentials: true, // Autorise l'envoi et la réception de cookies
	})
);

// Middleware pour parser les corps de requête JSON
app.use(express.json());

// Middleware pour parser les cookies des requêtes HTTP
app.use(cookieParser());

// Configuration des routes API
app.use("/api/auth", authRoutes); // Routes d'authentification (inscription, connexion, déconnexion)
app.use("/api/users", userRoutes); // Routes de gestion des utilisateurs et relations
app.use("/api/chat", chatRoutes); // Routes de gestion du chat et tokens

// Configuration pour servir les fichiers statiques en production
// Sert les fichiers compilés du frontend React/Vite
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	// Route catch-all pour les applications single-page
	// Renvoie index.html pour toutes les routes non-API
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
	});
}

// Création du serveur HTTP avec support WebSocket
const server = setupWebSocketServer(app);

// Démarrage du serveur sur le port configuré
server.listen(PORT, () => {
	console.log(`🚀 Serveur démarré sur le port ${PORT}`);
	console.log(
		`🔗 WebSocket collaboratif prêt pour la synchronisation en temps réel`
	);

	// Établissement de la connexion à la base de données MongoDB
	connectDB();
});
