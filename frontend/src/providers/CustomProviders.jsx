// CustomProvider.jsx
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";

export class CustomProvider {
  constructor(url, roomName, ydoc) {
    this.url = url;
    this.roomName = roomName;
    this.ydoc = ydoc;
    this.ws = null;
    this.awareness = new Awareness(ydoc);
    this.connected = false;

    this.connect();
    this.setupEventListeners();
  }

  connect() {
    this.ws = new WebSocket(`${this.url}?room=${this.roomName}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.connected = true;
      
      // Envoyer l'état actuel du document
      const stateVector = Y.encodeStateVector(this.ydoc);
      this.sendMessage({
        type: "sync-step-1",
        stateVector: Array.from(stateVector)
      });
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.connected = false;
      // Tentative de reconnexion après 3 secondes
      setTimeout(() => {
        if (!this.connected) {
          this.connect();
        }
      }, 3000);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  setupEventListeners() {
    // Écouter les changements du document Y.js
    this.ydoc.on("update", (update, origin) => {
      // Ne pas renvoyer nos propres updates
      if (origin !== this) {
        this.sendMessage({
          type: "doc-update",
          update: Array.from(update)
        });
      }
    });

    // Écouter les changements d'awareness (curseurs, sélections)
    this.awareness.on("update", ({ added, updated, removed }, origin) => {
      if (origin !== this) {
        const changedClients = added.concat(updated, removed);
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
          this.awareness, 
          changedClients
        );
        this.sendMessage({
          type: "awareness-update",
          update: Array.from(awarenessUpdate)
        });
      }
    });
  }

  handleMessage(data) {
    try {
      // Essayer de parser comme JSON d'abord
      const message = JSON.parse(data);
      
      switch (message.type) {
        case "sync-step-1":
          // Répondre avec les updates manquants
          const stateVector = new Uint8Array(message.stateVector);
          const diff = Y.encodeStateAsUpdate(this.ydoc, stateVector);
          if (diff.length > 0) {
            this.sendMessage({
              type: "sync-step-2",
              update: Array.from(diff)
            });
          }
          break;

        case "sync-step-2":
        case "doc-update":
          // Appliquer l'update au document
          const update = new Uint8Array(message.update);
          Y.applyUpdate(this.ydoc, update, this);
          break;

        case "awareness-update":
          // Appliquer l'update d'awareness
          const awarenessUpdate = new Uint8Array(message.update);
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness, 
            awarenessUpdate, 
            this
          );
          break;

        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (e) {
      // Si ce n'est pas du JSON, traiter comme update binaire (fallback)
      console.warn("Received non-JSON message, treating as binary update");
      if (data instanceof ArrayBuffer) {
        const update = new Uint8Array(data);
        Y.applyUpdate(this.ydoc, update, this);
      }
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  destroy() {
    this.connected = false;
    if (this.awareness) {
      this.awareness.destroy();
    }
    if (this.ws) {
      this.ws.close();
    }
    // Nettoyer les event listeners
    this.ydoc.off("update");
  }
}