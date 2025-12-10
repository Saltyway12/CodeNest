/**
 * ---------------------------------------------------------
 *  Server Bootstrap
 * ---------------------------------------------------------
 *  FR : Point d'entrée principal du backend.
 *       - Établit la connexion à MongoDB
 *       - Crée le serveur HTTP
 *       - Monte l'application Express
 *       - Attache le serveur WebSocket
 *       - Gère les erreurs globales
 *
 *  EN : Main backend entrypoint.
 *       - Establishes MongoDB connection
 *       - Creates HTTP server
 *       - Mounts Express application
 *       - Attaches WebSocket server
 *       - Handles global errors
 * ---------------------------------------------------------
 */

import http from "http";
import app from "./app.js";

import { connectDB } from "./lib/db.js"; // <-- Added
import { initWebSocketServer } from "./websocket/server.js";

/* ---------------------------------------------------------
 *  Load Server Port
 * ---------------------------------------------------------
 *  FR : Utilise PORT si défini, sinon 5000 par défaut.
 *  EN : Use PORT if defined, otherwise default to 5000.
 * --------------------------------------------------------- */

const PORT = process.env.PORT || 5000;

/* ---------------------------------------------------------
 *  Connect to Database
 * ---------------------------------------------------------
 *  FR : On se connecte à MongoDB AVANT de démarrer le serveur.
 *  EN : Connect to MongoDB BEFORE starting the HTTP server.
 * --------------------------------------------------------- */

connectDB();

/* ---------------------------------------------------------
 *  Create HTTP Server
 * --------------------------------------------------------- */

const server = http.createServer(app);

/* ---------------------------------------------------------
 *  Initialize WebSocket Server
 * --------------------------------------------------------- */

initWebSocketServer(server);

/* ---------------------------------------------------------
 *  Start Server
 * ---------------------------------------------------------
 */

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

/* ---------------------------------------------------------
 *  Global Error Handlers
 * ---------------------------------------------------------
 */

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
});
