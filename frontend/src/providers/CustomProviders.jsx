// CustomProvider.jsx
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";

export class CustomProvider {
  constructor(url, roomName, ydoc) {
    this.url = url;
    this.roomName = roomName;
    this.ydoc = ydoc;
    this.ws = null;
    this.awareness = new Awareness(ydoc);
    this.connected = false;
    this.synced = false;
    
    // Buffer pour les updates en attente
    this.updateQueue = [];
    this.processingQueue = false;

    this.connect();
    this.setupEventListeners();
  }

  connect() {
    this.ws = new WebSocket(`${this.url}?room=${this.roomName}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.connected = true;
      
      // Protocole de synchronisation Y.js standard
      const encoder = syncProtocol.writeVarUint(new syncProtocol.Encoder(), syncProtocol.messageYjsSyncStep1);
      syncProtocol.writeSyncStep1(encoder, this.ydoc);
      
      this.sendMessage({
        type: "sync-step-1", 
        stateVector: Array.from(encoder.toUint8Array())
      });
    };

    this.ws.onmessage = (event) => {
      // Ajouter Ã  la queue pour traitement sÃ©quentiel
      this.updateQueue.push(event.data);
      this.processUpdateQueue();
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.connected = false;
      this.synced = false;
      
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

  async processUpdateQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    while (this.updateQueue.length > 0) {
      const data = this.updateQueue.shift();
      await this.handleMessage(data);
    }

    this.processingQueue = false;
  }

  async handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case "sync-step-1": {
          // RÃ©pondre avec les updates manquants
          const stateVector = new Uint8Array(message.stateVector);
          const decoder = new syncProtocol.Decoder(stateVector);
          const encoder = new syncProtocol.Encoder();
          
          const messageType = syncProtocol.readVarUint(decoder);
          if (messageType === syncProtocol.messageYjsSyncStep1) {
            syncProtocol.readSyncStep1(decoder, encoder, this.ydoc);
            
            if (encoder.length > 0) {
              this.sendMessage({
                type: "sync-step-2",
                update: Array.from(encoder.toUint8Array())
              });
            }
          }
          break;
        }

        case "sync-step-2":
        case "doc-update": {
          // Traitement sÃ©curisÃ© des updates
          const update = new Uint8Array(message.update);
          
          // VÃ©rifier que l'update est valide avant de l'appliquer
          if (this.isValidUpdate(update)) {
            Y.applyUpdate(this.ydoc, update, this);
            
            if (message.type === "sync-step-2") {
              this.synced = true;
            }
          }
          break;
        }

        case "awareness-update": {
          const awarenessUpdate = new Uint8Array(message.update);
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness, 
            awarenessUpdate, 
            this
          );
          break;
        }

        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (e) {
      console.warn("Error processing message:", e);
    }
  }

  isValidUpdate(update) {
    try {
      // CrÃ©er un document temporaire pour tester l'update
      const testDoc = new Y.Doc();
      const currentState = Y.encodeStateAsUpdate(this.ydoc);
      Y.applyUpdate(testDoc, currentState);
      Y.applyUpdate(testDoc, update);
      
      testDoc.destroy();
      return true;
    } catch (e) {
      console.warn("Invalid update detected:", e);
      return false;
    }
  }

  setupEventListeners() {
    // DÃ©bouncer les updates pour Ã©viter le spam
    let updateTimeout = null;
    
    this.ydoc.on("update", (update, origin) => {
      if (origin !== this && this.connected && this.synced) {
        // DÃ©bouncer les updates rapides
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        updateTimeout = setTimeout(() => {
          this.sendMessage({
            type: "doc-update",
            update: Array.from(update),
            timestamp: Date.now()
          });
        }, 50); // 50ms de dÃ©lai pour grouper les updates
      }
    });

    // Gestion awareness avec dÃ©bouncing
    let awarenessTimeout = null;
    this.awareness.on("update", ({ added, updated, removed }, origin) => {
      if (origin !== this && this.connected) {
        if (awarenessTimeout) {
          clearTimeout(awarenessTimeout);
        }
        
        awarenessTimeout = setTimeout(() => {
          const changedClients = added.concat(updated, removed);
          const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
            this.awareness, 
            changedClients
          );
          
          this.sendMessage({
            type: "awareness-update",
            update: Array.from(awarenessUpdate)
          });
        }, 100);
      }
    });
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
    this.ydoc.off("update");
    this.updateQueue = [];
  }
}