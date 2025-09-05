// CustomProvider.jsx - Version améliorée pour éviter les conflits
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
    
    // File d'attente pour traitement séquentiel des messages
    this.messageQueue = [];
    this.processingQueue = false;
    
    // Système de retry pour les updates échouées
    this.retryQueue = [];
    this.maxRetries = 3;
    
    // Tracking des updates pour éviter les boucles
    this.lastSentUpdate = null;
    this.pendingUpdates = new Set();

    this.connect();
    this.setupEventListeners();
  }

  connect() {
    this.ws = new WebSocket(`${this.url}?room=${this.roomName}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log(`🔗 WebSocket connected to room: ${this.roomName}`);
      this.connected = true;
      
      // Demander la synchronisation complète
      this.requestFullSync();
    };

    this.ws.onmessage = (event) => {
      // Ajouter à la queue pour traitement séquentiel
      this.messageQueue.push(event.data);
      this.processMessageQueue();
    };

    this.ws.onclose = (event) => {
      console.log(`❌ WebSocket disconnected: ${event.code} ${event.reason}`);
      this.connected = false;
      this.synced = false;
      
      // Reconnexion automatique avec backoff exponentiel
      const retryDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts || 0), 30000);
      this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
      
      setTimeout(() => {
        if (!this.connected) {
          console.log(`🔄 Attempting reconnection... (attempt ${this.reconnectAttempts})`);
          this.connect();
        }
      }, retryDelay);
    };

    this.ws.onerror = (error) => {
      console.error("💥 WebSocket error:", error);
    };
  }

  requestFullSync() {
    // Protocole Y.js standard pour sync step 1
    const encoder = new syncProtocol.Encoder();
    syncProtocol.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
    syncProtocol.writeSyncStep1(encoder, this.ydoc);
    
    this.sendMessage({
      type: "sync-step-1", 
      stateVector: Array.from(encoder.toUint8Array()),
      timestamp: Date.now()
    });
  }

  async processMessageQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      while (this.messageQueue.length > 0) {
        const data = this.messageQueue.shift();
        await this.handleMessage(data);
        
        // Petite pause pour éviter de bloquer le thread
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    } catch (error) {
      console.error("Error processing message queue:", error);
    } finally {
      this.processingQueue = false;
    }
  }

  async handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Ignorer nos propres messages si ils reviennent
      if (message.clientId === this.clientId) {
        return;
      }
      
      switch (message.type) {
        case "sync-step-1": {
          console.log(`📤 Handling sync-step-1 from server`);
          const stateVector = new Uint8Array(message.stateVector);
          const decoder = new syncProtocol.Decoder(stateVector);
          const encoder = new syncProtocol.Encoder();
          
          const messageType = syncProtocol.readVarUint(decoder);
          if (messageType === syncProtocol.messageYjsSyncStep1) {
            syncProtocol.readSyncStep1(decoder, encoder, this.ydoc);
            
            if (encoder.length > 0) {
              this.sendMessage({
                type: "sync-step-2",
                update: Array.from(encoder.toUint8Array()),
                timestamp: Date.now()
              });
            }
          }
          break;
        }

        case "sync-step-2": {
          console.log(`📥 Applying sync-step-2 update`);
          await this.applyUpdate(new Uint8Array(message.update), true);
          this.synced = true;
          console.log("✅ Initial sync completed");
          break;
        }

        case "doc-update": {
          console.log(`📝 Applying document update`);
          await this.applyUpdate(new Uint8Array(message.update), false);
          break;
        }

        case "awareness-update": {
          console.log(`👁️ Applying awareness update`);
          const awarenessUpdate = new Uint8Array(message.update);
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness, 
            awarenessUpdate, 
            this
          );
          break;
        }

        default:
          console.warn("⚠️ Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("❌ Error processing message:", error);
      // Tenter de traiter comme update binaire (fallback)
      await this.handleBinaryMessage(data);
    }
  }

  async applyUpdate(update, isSync = false) {
    try {
      // Vérifier la validité de l'update avant application
      if (!this.isValidUpdate(update)) {
        console.warn("⚠️ Invalid update received, skipping");
        return;
      }

      // Créer un hash de l'update pour éviter les doublons
      const updateHash = this.hashUpdate(update);
      if (this.pendingUpdates.has(updateHash)) {
        console.log("🔄 Duplicate update detected, skipping");
        return;
      }

      // Marquer comme en cours de traitement
      this.pendingUpdates.add(updateHash);

      // Appliquer l'update de manière transactionnelle
      this.ydoc.transact(() => {
        Y.applyUpdate(this.ydoc, update, this);
      }, this);

      console.log(`✅ Update applied successfully ${isSync ? '(sync)' : ''}`);
      
      // Nettoyer le hash après un délai
      setTimeout(() => {
        this.pendingUpdates.delete(updateHash);
      }, 5000);

    } catch (error) {
      console.error("❌ Error applying update:", error);
      this.pendingUpdates.delete(this.hashUpdate(update));
      throw error;
    }
  }

  hashUpdate(update) {
    // Créer un hash simple de l'update pour détecter les doublons
    let hash = 0;
    for (let i = 0; i < update.length; i++) {
      const char = update[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async handleBinaryMessage(data) {
    try {
      const update = new Uint8Array(data);
      await this.applyUpdate(update);
    } catch (error) {
      console.error("❌ Error processing binary message:", error);
    }
  }

  isValidUpdate(update) {
    try {
      // Test plus robuste de la validité
      const testDoc = new Y.Doc();
      
      // Appliquer l'état actuel
      const currentState = Y.encodeStateAsUpdate(this.ydoc);
      Y.applyUpdate(testDoc, currentState);
      
      // Tester l'application de la nouvelle update
      Y.applyUpdate(testDoc, update);
      
      // Vérifier que le document est dans un état cohérent
      const finalState = Y.encodeStateAsUpdate(testDoc);
      
      testDoc.destroy();
      return finalState.length > 0;
    } catch (error) {
      console.warn("⚠️ Invalid update detected:", error.message);
      return false;
    }
  }

  setupEventListeners() {
    // Générer un ID client unique
    this.clientId = Math.random().toString(36).substr(2, 9);
    
    // Debouncer plus intelligent pour les updates
    let updateTimeout = null;
    let pendingUpdate = null;
    
    this.ydoc.on("update", (update, origin) => {
      // Ignorer les updates qui viennent de nous-mêmes via le provider
      if (origin === this) {
        return;
      }

      if (!this.connected || !this.synced) {
        console.log("📦 Queuing update (not connected/synced)");
        return;
      }

      // Accumuler les updates pour éviter le spam
      if (pendingUpdate) {
        // Merger avec l'update précédente si possible
        try {
          const mergedUpdate = Y.mergeUpdates([pendingUpdate, update]);
          pendingUpdate = mergedUpdate;
        } catch (error) {
          // Si merge échoue, utiliser la plus récente
          pendingUpdate = update;
        }
      } else {
        pendingUpdate = update;
      }

      // Debouncer l'envoi
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(() => {
        if (pendingUpdate && this.connected && this.synced) {
          const updateHash = this.hashUpdate(pendingUpdate);
          
          this.sendMessage({
            type: "doc-update",
            update: Array.from(pendingUpdate),
            timestamp: Date.now(),
            clientId: this.clientId,
            hash: updateHash
          });
          
          this.lastSentUpdate = updateHash;
          pendingUpdate = null;
        }
      }, 100); // Délai plus long pour grouper efficacement
    });

    // Awareness avec gestion améliorée
    let awarenessTimeout = null;
    this.awareness.on("update", ({ added, updated, removed }, origin) => {
      if (origin === this || !this.connected) {
        return;
      }
      
      if (awarenessTimeout) {
        clearTimeout(awarenessTimeout);
      }
      
      awarenessTimeout = setTimeout(() => {
        try {
          const changedClients = added.concat(updated, removed);
          const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
            this.awareness, 
            changedClients
          );
          
          this.sendMessage({
            type: "awareness-update",
            update: Array.from(awarenessUpdate),
            clientId: this.clientId,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("❌ Error sending awareness update:", error);
        }
      }, 150);
    });

    // Cleanup des updates expirées
    setInterval(() => {
      this.cleanupPendingUpdates();
    }, 30000); // Toutes les 30 secondes
  }

  cleanupPendingUpdates() {
    const now = Date.now();
    const expiredHashes = [];
    
    this.pendingUpdates.forEach(hash => {
      // Supprimer les hash de plus de 5 minutes
      if (typeof hash === 'string' && hash.includes('-')) {
        const timestamp = parseInt(hash.split('-')[1]);
        if (now - timestamp > 300000) {
          expiredHashes.push(hash);
        }
      }
    });
    
    expiredHashes.forEach(hash => {
      this.pendingUpdates.delete(hash);
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("❌ Error sending message:", error);
        // Ajouter à la queue de retry si nécessaire
        this.addToRetryQueue(message);
      }
    } else {
      console.log("📦 Queuing message (WebSocket not ready)");
      this.addToRetryQueue(message);
    }
  }

  addToRetryQueue(message) {
    this.retryQueue.push({
      message,
      attempts: 0,
      timestamp: Date.now()
    });
  }

  processRetryQueue() {
    if (!this.connected) return;
    
    const now = Date.now();
    this.retryQueue = this.retryQueue.filter(item => {
      // Supprimer les messages trop anciens (> 1 minute)
      if (now - item.timestamp > 60000) {
        return false;
      }
      
      if (item.attempts < this.maxRetries) {
        item.attempts++;
        this.sendMessage(item.message);
        return true;
      }
      
      return false;
    });
  }

  // Méthode pour forcer une resynchronisation
  resync() {
    if (this.connected) {
      console.log("🔄 Forcing resync...");
      this.synced = false;
      this.requestFullSync();
    }
  }

  destroy() {
    this.connected = false;
    
    if (this.awareness) {
      this.awareness.destroy();
    }
    
    if (this.ws) {
      this.ws.close(1000, "Provider destroyed");
    }
    
    // Nettoyer les event listeners
    this.ydoc.off("update");
    
    // Vider les queues
    this.messageQueue = [];
    this.retryQueue = [];
    this.pendingUpdates.clear();
    
    console.log("🧹 Provider destroyed and cleaned up");
  }
}