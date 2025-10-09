import http from "http";
import { WebSocketServer } from "ws";
import url from "url";

// Stockage des salles de collaboration en mémoire
// Structure: Map<callId, { clients: Set<WebSocket>, content: string }>
// Chaque salle est identifiée par un callId unique
const rooms = new Map();

/**
 * Récupère une salle existante ou la crée si elle n'existe pas
 * @param {string} callId - Identifiant unique de la salle
 * @returns {object} Objet salle contenant les clients connectés et le contenu partagé
 */
function getRoom(callId) {
  if (!rooms.has(callId)) {
    rooms.set(callId, {
      clients: new Set(),
      content: "", // Contenu collaboratif initial vide
      language: "javascript", // Langage par défaut synchronisé
    });
  }
  return rooms.get(callId);
}

/**
 * Supprime une salle vide de la mémoire
 * @param {string} callId - Identifiant de la salle à nettoyer
 */
function cleanupRoom(callId) {
  const room = rooms.get(callId);
  if (room && room.clients.size === 0) {
    rooms.delete(callId);
  }
}

/**
 * Gère la connexion d'un nouveau client WebSocket à une salle
 * @param {WebSocket} ws - Instance WebSocket du client
 * @param {string} callId - Identifiant de la salle à rejoindre
 */
function handleConnection(ws, callId) {
  const room = getRoom(callId);
  room.clients.add(ws);

  // Envoi du contenu initial de la salle au nouveau client
  try {
    const initialMessage = {
      type: "INITIAL_CONTENT",
      content: room.content,
      language: room.language,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(initialMessage));
  } catch (error) {
    console.error("Erreur lors de l'envoi du contenu initial:", error);
  }

  // Notification aux autres clients de l'arrivée du nouveau participant
  broadcastToRoom(
    callId,
    {
      type: "USER_JOINED",
      participantCount: room.clients.size,
    },
    ws, // Exclusion de l'expéditeur
  );

  // Écoute des messages entrants du client
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "DELTA_CHANGE":
          // Traitement des modifications collaboratives du contenu
          handleDeltaChange(callId, message, ws);
          break;

        case "CURSOR_POSITION":
          // Synchronisation de la position du curseur entre clients
          handleCursorPosition(callId, message, ws);
          break;

        case "LANGUAGE_CHANGE":
          handleLanguageChange(callId, message, ws);
          break;

        default:
          console.warn(`Type de message inconnu: ${message.type}`);
      }
    } catch (error) {
      console.error("Erreur lors du parsing du message:", error);
    }
  });

  // Gestion de la déconnexion du client
  ws.on("close", () => {
    room.clients.delete(ws);

    // Notification aux participants restants
    if (room.clients.size > 0) {
      broadcastToRoom(callId, {
        type: "USER_LEFT",
        participantCount: room.clients.size,
      });
    }

    cleanupRoom(callId);
  });

  // Gestion des erreurs WebSocket
  ws.on("error", (error) => {
    console.error("Erreur WebSocket:", error);
    room.clients.delete(ws);
    cleanupRoom(callId);
  });
}

/**
 * Traite le changement de langage de programmation dans l'éditeur
 * Met à jour l'état de la salle et notifie les autres participants
 * @param {string} callId - Identifiant de la salle
 * @param {object} message - Message contenant le nouveau langage
 * @param {WebSocket} senderWs - WebSocket de l'expéditeur
 */
function handleLanguageChange(callId, message, senderWs) {
  const room = getRoom(callId);
  const { language, userId } = message;

  if (typeof language !== "string" || language.trim() === "") {
    console.warn("Langage invalide reçu:", language);
    return;
  }

  const normalizedLanguage = language.trim();
  room.language = normalizedLanguage;

  const languageMessage = {
    type: "LANGUAGE_CHANGE",
    language: normalizedLanguage,
    userId,
    timestamp: Date.now(),
  };

  broadcastToRoom(callId, languageMessage, senderWs);
}

/**
 * Traite les modifications delta du contenu collaboratif
 * Applique les changements et les synchronise avec les autres clients
 * @param {string} callId - Identifiant de la salle
 * @param {object} message - Message contenant les modifications delta
 * @param {WebSocket} senderWs - WebSocket de l'expéditeur
 */
function handleDeltaChange(callId, message, senderWs) {
  const room = getRoom(callId);
  const { changes } = message;

  // Validation de la structure des données
  if (!Array.isArray(changes)) {
    console.error("La propriété changes n'est pas un tableau:", changes);
    return;
  }

  if (changes.length === 0) {
    return;
  }

  try {
    let content = room.content;

    // Tri des changements par offset décroissant
    // Évite le décalage des indices lors de l'application séquentielle
    const sortedChanges = [...changes].sort(
      (a, b) => (b.rangeOffset || 0) - (a.rangeOffset || 0),
    );

    // Application séquentielle des modifications
    for (const change of sortedChanges) {
      const rangeOffset = change.rangeOffset || 0;
      const rangeLength = change.rangeLength || 0;
      const text = change.text || "";

      // Validation des limites de modification
      if (rangeOffset < 0 || rangeOffset > content.length) {
        console.error(
          `Offset invalide: ${rangeOffset}, contenu: ${content.length} caractères`,
        );
        continue;
      }

      if (rangeOffset + rangeLength > content.length) {
        console.error(
          `Intervalle invalide: offset=${rangeOffset}, length=${rangeLength}, contenu: ${content.length} caractères`,
        );
        continue;
      }

      // Application de la modification au contenu
      content =
        content.slice(0, rangeOffset) +
        text +
        content.slice(rangeOffset + rangeLength);
    }

    // Mise à jour du contenu partagé de la salle
    room.content = content;

    // Diffusion des modifications aux autres clients
    const deltaMessage = {
      type: "DELTA_CHANGE",
      changes: changes, // Conservation de l'ordre original
      timestamp: Date.now(),
    };

    broadcastToRoom(callId, deltaMessage, senderWs);
  } catch (error) {
    console.error("Erreur lors de l'application du delta:", error);
  }
}

/**
 * Synchronise la position du curseur d'un client avec les autres
 * @param {string} callId - Identifiant de la salle
 * @param {object} message - Message contenant les données de position du curseur
 * @param {WebSocket} senderWs - WebSocket de l'expéditeur
 */
function handleCursorPosition(callId, message, senderWs) {
  const cursorMessage = {
    type: "CURSOR_POSITION",
    userId: message.userId,
    position: message.position,
    color: message.color,
  };

  // Diffusion de la position du curseur aux autres clients
  broadcastToRoom(callId, cursorMessage, senderWs);
}

/**
 * Diffuse un message à tous les clients d'une salle
 * @param {string} callId - Identifiant de la salle
 * @param {object} message - Message à diffuser
 * @param {WebSocket} excludeWs - Client à exclure de la diffusion (optionnel)
 */
function broadcastToRoom(callId, message, excludeWs = null) {
  const room = rooms.get(callId);
  if (!room) {
    console.warn(`Salle ${callId} introuvable pour la diffusion`);
    return;
  }

  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  let failedCount = 0;

  // Envoi du message à chaque client connecté
  room.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      try {
        client.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        room.clients.delete(client);
        failedCount++;
      }
    }
  });

  // Nettoyage des clients déconnectés
  if (failedCount > 0) {
    cleanupRoom(callId);
  }
}

/**
 * Configure et initialise le serveur WebSocket
 * @param {Express} app - Instance de l'application Express
 * @returns {http.Server} Serveur HTTP avec support WebSocket
 */
export function setupWebSocketServer(app) {
  const server = http.createServer(app);

  // Création du serveur WebSocket monté sur le serveur HTTP
  const wss = new WebSocketServer({
    server,
    path: "/ws", // Endpoint WebSocket accessible via ws://localhost:PORT/ws?callId=xxx
  });

  // Gestionnaire de nouvelles connexions WebSocket
  wss.on("connection", (ws, req) => {
    try {
      // Extraction du paramètre callId depuis l'URL
      const queryParams = url.parse(req.url, true).query;
      const callId = queryParams.callId;

      if (!callId) {
        console.error("CallId manquant dans la connexion WebSocket");
        ws.close(1008, "CallId requis");
        return;
      }

      handleConnection(ws, callId);
    } catch (error) {
      console.error("Erreur lors de la configuration de la connexion WebSocket:", error);
      ws.close(1011, "Erreur serveur");
    }
  });

  // Gestionnaire d'erreurs globales du serveur WebSocket
  wss.on("error", (error) => {
    console.error("Erreur du WebSocketServer:", error);
  });

  // Tâche de maintenance périodique (30 secondes) pour nettoyer les ressources orphelines
  setInterval(() => {
    rooms.forEach((room, callId) => {
      room.clients.forEach((client) => {
        if (client.readyState !== 1) {
          room.clients.delete(client);
        }
      });

      if (room.clients.size === 0) {
        rooms.delete(callId);
      }
    });
  }, 30000);

  return server;
}
