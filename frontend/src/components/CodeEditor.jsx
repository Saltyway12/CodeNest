// CodeEditor.jsx
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";

import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { useParams } from "react-router";

/**
 * Éditeur de code collaboratif basé sur Monaco + Y.js + WebRTC + y-monaco.
 * - Texte partagé entre les participants
 * - Curseurs visibles avec une couleur unique par utilisateur
 * - Utilise WebRTC pour une connexion peer-to-peer sans serveur
 * Chaque appel (callId) correspond à une room WebRTC distincte.
 */
const CodeEditor = () => {
  const { id: callId } = useParams(); // récupère l'ID d'appel
  const editorRef = useRef(null);     // référence à Monaco Editor
  const monacoRef = useRef(null);     // référence à l'API monaco
  const providerRef = useRef(null);   // référence au provider WebRTC
  const ydocRef = useRef(null);       // référence au document Y.js
  const bindingRef = useRef(null);    // référence au binding Y.js/Monaco

  const [language, setLanguage] = useState("javascript");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [connectedPeers, setConnectedPeers] = useState(0);

  useEffect(() => {
    // 1. Crée un document Y.js
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2. WebRTC avec serveurs de signaling mis à jour et fallback
    const roomName = `call-${callId}-editor`;
    console.log("Connecting to room:", roomName);
    
    // Liste de serveurs de signaling alternatifs et plus fiables
    const signalingServers = [
      'wss://signaling.yjs.dev',
      'wss://demos.yjs.dev/ws',
      'ws://localhost:4444' // Pour développement local si vous avez un serveur
    ];
    
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: signalingServers,
      maxConns: 20,
      filterBcConns: true,
      // Configuration WebRTC améliorée
      peerOpts: {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:stun.nextcloud.com:443' },
            // Serveurs TURN gratuits (limités mais fonctionnels)
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',  
              credential: 'openrelayproject'
            }
          ],
          iceCandidatePoolSize: 10,
          iceTransportPolicy: 'all' // Permet tous les types de connexion
        }
      },
      // Retry automatique en cas d'échec
      awareness: {
        timeout: 30000 // 30 secondes
      }
    });
    
    providerRef.current = provider;

    // Gestion avancée des erreurs de connexion
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const handleReconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Tentative de reconnexion ${reconnectAttempts}/${maxReconnectAttempts}`);
        setConnectionStatus('reconnecting');
        
        setTimeout(() => {
          if (provider.shouldConnect && !provider.connected) {
            provider.connect();
          }
        }, 2000 * reconnectAttempts); // Délai croissant
      } else {
        console.log('Nombre maximum de tentatives de reconnexion atteint');
        setConnectionStatus('failed');
      }
    };

    // Événements de connexion avec gestion d'erreur
    provider.on('status', event => {
      console.log('WebRTC status:', event.status);
      setConnectionStatus(event.status);
      
      if (event.status === 'disconnected') {
        handleReconnect();
      } else if (event.status === 'connected') {
        reconnectAttempts = 0; // Reset le compteur si connexion réussie
      }
    });

    provider.on('peers', event => {
      console.log('Connected peers - added:', event.added, 'removed:', event.removed);
      const peersCount = provider.room?.bcConns?.size || 0;
      setConnectedPeers(peersCount);
      
      // Si aucun peer après 30 secondes, essayer de reconnecter
      if (peersCount === 0) {
        setTimeout(() => {
          if ((provider.room?.bcConns?.size || 0) === 0) {
            console.log('Aucun peer trouvé, tentative de reconnexion...');
            handleReconnect();
          }
        }, 30000);
      }
    });

    // Écouter les changements de synchronisation
    provider.on('synced', event => {
      console.log('Document synced:', event.synced);
    });

    // Gestion des erreurs WebSocket
    provider.on('connection-error', (error) => {
      console.error('Erreur de connexion WebRTC:', error);
      setConnectionStatus('error');
      handleReconnect();
    });

    return () => {
      // Nettoie le binding avant de détruire le provider
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      provider.destroy();
      ydoc.destroy();
    };
  }, [callId]);

  // Quand Monaco Editor est monté
  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = ydocRef.current;
    const provider = providerRef.current;
    if (!ydoc || !provider) return;

    const yText = ydoc.getText("monaco");

    // 3. Lier Y.Text à Monaco via y-monaco
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness // awareness = présence (curseurs)
    );

    // Stocker la référence pour le nettoyage
    bindingRef.current = binding;

    // Configuration de l'awareness (curseurs collaboratifs)
    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
    const userName = `User-${Math.floor(Math.random() * 1000)}`;
    
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor
    });

    console.log(`Utilisateur connecté: ${userName} avec la couleur ${userColor}`);

    // Initialiser avec le snippet par défaut si le document est vide
    if (yText.length === 0) {
      const defaultSnippet = CODE_SNIPPETS[language] || "";
      yText.insert(0, defaultSnippet);
    }

    // Focus initial
    editor.focus();
  };

  // Quand on change de langage
  const onSelect = (lang) => {
    setLanguage(lang);

    const snippet = CODE_SNIPPETS[lang] || "";
    
    // Utilise Y.js pour modifier le contenu (synchronisation collaborative)
    const ydoc = ydocRef.current;
    if (ydoc) {
      const yText = ydoc.getText("monaco");
      
      // Supprime tout le contenu existant et insère le nouveau snippet
      // Ceci sera synchronisé avec tous les participants
      yText.delete(0, yText.length);
      yText.insert(0, snippet);
    }
    
    // Note: Pas besoin d'appeler editor.setValue() car Y.js va automatiquement 
    // mettre à jour Monaco Editor via le binding
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': 
      case 'reconnecting': return 'text-yellow-500';
      case 'disconnected': 
      case 'error':
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Fonction pour obtenir le texte de statut
  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'reconnecting': return 'Reconnexion...';
      case 'disconnected': return 'Déconnecté';
      case 'error': return 'Erreur de connexion';
      case 'failed': return 'Connexion échouée';
      default: return 'État inconnu';
    }
  };

  // Fonction pour forcer la reconnexion
  const forceReconnect = () => {
    const provider = providerRef.current;
    if (provider) {
      console.log('Reconnexion forcée...');
      setConnectionStatus('connecting');
      provider.disconnect();
      setTimeout(() => {
        provider.connect();
      }, 1000);
    }
  };

  return (
    <div>
      {/* Barre de statut de connexion améliorée */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center text-sm mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className={getStatusColor(connectionStatus)}>
                {getStatusText(connectionStatus)}
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {connectedPeers} participant{connectedPeers !== 1 ? 's' : ''} connecté{connectedPeers !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-xs">
              Room: {callId}
            </div>
            {(connectionStatus === 'disconnected' || connectionStatus === 'error' || connectionStatus === 'failed') && (
              <button 
                onClick={forceReconnect}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
              >
                Reconnecter
              </button>
            )}
          </div>
        </div>
        
        {/* Message d'aide en cas de problème */}
        {(connectionStatus === 'error' || connectionStatus === 'failed') && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            💡 Astuce: Vérifiez votre connexion internet ou essayez de recharger la page
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* Colonne éditeur */}
        <div className="w-1/2">
          <LanguageSelector language={language} onSelect={onSelect} />
          <Editor
            options={{ 
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              cursorBlinking: 'smooth'
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            onMount={onMount}
          />
        </div>

        {/* Colonne output */}
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
};

export default CodeEditor;