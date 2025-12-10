/**
 * ---------------------------------------------------------
 *  WebSocket Server Initialization
 * ---------------------------------------------------------
 *  FR : Initialise le serveur WebSocket en se greffant sur
 *       le serveur HTTP existant. Ce fichier ne contient pas
 *       la logique métier : uniquement l’infrastructure WS.
 *
 *  EN : Initializes the WebSocket server by attaching it to
 *       the existing HTTP server. This file does not contain
 *       business logic: only WebSocket infrastructure setup.
 * ---------------------------------------------------------
 */
import { WebSocketServer } from "ws";
import { handleIncomingMessage } from "./events.js";
// FR : Gestionnaire centralisé des messages entrants
// EN : Centralized handler for incoming WS messages

/**
 * FR : Initialise un serveur WebSocket et attache les hooks
 *      nécessaires (connexion, réception de messages,
 *      déconnexion).
 *
 * EN : Initializes a WebSocket server and attaches required
 *      event listeners (connection, message, disconnect).
 */
export function initWebSocketServer(server) {
	const wss = new WebSocketServer({ server });

	console.log("WebSocket server initialized");

	// ---------------------------------------------------------
	// Handle new client connections
	// ---------------------------------------------------------
	wss.on("connection", (ws) => {
		console.log("Client connected");

		// ---------------------------------------------
		// Handle messages sent by this client
		// ---------------------------------------------
		ws.on("message", (rawMessage) => {
			// FR : Centralise la gestion des messages
			// EN : Delegates message handling to central processor
			handleIncomingMessage(wss, ws, rawMessage);
		});

		// ---------------------------------------------
		// Handle client disconnection
		// ---------------------------------------------
		ws.on("close", () => {
			handleLeaveRoom(wss, ws);
		});

		// ---------------------------------------------
		// Handle errors
		// ---------------------------------------------
		ws.on("error", (err) => {
			console.error("WebSocket Error:", err);
		});
	});

	return wss;
}
