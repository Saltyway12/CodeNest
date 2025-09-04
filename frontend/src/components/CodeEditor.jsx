// CodeEditor.jsx - Version avec fallback local
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
 * Éditeur de code avec fallback local quand les serveurs de signaling sont indisponibles
 */
const CodeEditor = () => {
  const { id: callId } = useParams();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [useLocalMode, setUseLocalMode] = useState(false);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = `call-${callId}-editor`;
    console.log("Connecting to room:", roomName);

    // Timeout pour basculer en mode local si aucune connexion
    const fallbackTimer = setTimeout(() => {
      console.log("Basculement en mode local (pas de connexion réseau)");
      setUseLocalMode(true);
      setConnectionStatus("local");
    }, 10000); // 10 secondes

    try {
      // Configuration minimaliste sans serveurs externes
      const provider = new WebrtcProvider(roomName, ydoc, {
        // Pas de serveurs de signaling - connexion directe uniquement
        signaling: [],
        maxConns: 20,
        filterBcConns: true,
        peerOpts: {
          config: {
            // Seulement des serveurs STUN Google (très fiables)
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 5
          }
        }
      });

      providerRef.current = provider;

      let connectionTimeout = setTimeout(() => {
        if (connectionStatus === 'connecting') {
          console.log("Timeout de connexion - basculement en mode local");
          setUseLocalMode(true);
          setConnectionStatus("local");
          clearTimeout(fallbackTimer);
        }
      }, 8000);

      provider.on('status', event => {
        console.log('WebRTC status:', event.status);
        setConnectionStatus(event.status || 'disconnected');
        
        if (event.status === 'connected') {
          clearTimeout(connectionTimeout);
          clearTimeout(fallbackTimer);
          setUseLocalMode(false);
        }
      });

      provider.on('peers', event => {
        const peersCount = provider.room?.bcConns?.size || 0;
        console.log('Connected peers count:', peersCount);
        setConnectedPeers(peersCount);
        
        if (peersCount > 0) {
          clearTimeout(connectionTimeout);
          clearTimeout(fallbackTimer);
          setUseLocalMode(false);
          setConnectionStatus('connected');
        }
      });

      provider.on('synced', event => {
        console.log('Document synced:', event.synced);
      });

    } catch (error) {
      console.error('Erreur lors de la création du provider WebRTC:', error);
      setUseLocalMode(true);
      setConnectionStatus("error");
      clearTimeout(fallbackTimer);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      ydoc.destroy();
    };
  }, [callId]);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const yText = ydoc.getText("monaco");

    // Créer le binding même en mode local
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      // En mode local, pas d'awareness collaborative
      useLocalMode ? null : (providerRef.current?.awareness || null)
    );

    bindingRef.current = binding;

    // Initialiser avec le snippet par défaut
    if (yText.length === 0) {
      const defaultSnippet = CODE_SNIPPETS[language] || "";
      yText.insert(0, defaultSnippet);
    }

    // Configuration utilisateur en mode collaboratif
    if (!useLocalMode && providerRef.current?.awareness) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      });
    }

    editor.focus();
  };

  const onSelect = (lang) => {
    setLanguage(lang);
    const snippet = CODE_SNIPPETS[lang] || "";
    
    const ydoc = ydocRef.current;
    if (ydoc) {
      const yText = ydoc.getText("monaco");
      yText.delete(0, yText.length);
      yText.insert(0, snippet);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'local': return 'text-blue-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected':
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connecté (Collaboratif)';
      case 'local': return 'Mode Local';
      case 'connecting': return 'Connexion...';
      case 'disconnected': return 'Déconnecté';
      case 'error': return 'Erreur réseau';
      default: return 'État inconnu';
    }
  };

  const getStatusMessage = () => {
    if (useLocalMode || connectionStatus === 'local') {
      return "✏️ Édition en mode local - Les changements ne sont pas partagés";
    }
    if (connectionStatus === 'connected') {
      return "🌐 Mode collaboratif actif - Les changements sont partagés";
    }
    if (connectionStatus === 'connecting') {
      return "🔄 Tentative de connexion pour le mode collaboratif...";
    }
    return "⚠️ Problème de connexion réseau";
  };

  const forceLocalMode = () => {
    console.log("Forcer le mode local");
    setUseLocalMode(true);
    setConnectionStatus("local");
    if (providerRef.current) {
      providerRef.current.disconnect();
    }
  };

  const retryConnection = () => {
    console.log("Nouvelle tentative de connexion");
    setUseLocalMode(false);
    setConnectionStatus("connecting");
    if (providerRef.current) {
      providerRef.current.connect();
    }
  };

  return (
    <div>
      {/* Barre de statut améliorée */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center text-sm mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'local' ? 'bg-blue-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={getStatusColor(connectionStatus)}>
                {getStatusText(connectionStatus)}
              </span>
            </div>
            {!useLocalMode && (
              <div className="text-gray-600 dark:text-gray-400">
                {connectedPeers} participant{connectedPeers !== 1 ? 's' : ''} connecté{connectedPeers !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-xs">
              Room: {callId}
            </div>
            {useLocalMode ? (
              <button 
                onClick={retryConnection}
                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
              >
                Réessayer Collaboratif
              </button>
            ) : connectionStatus !== 'connected' && (
              <button 
                onClick={forceLocalMode}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
              >
                Mode Local
              </button>
            )}
          </div>
        </div>
        
        {/* Message d'information */}
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {getStatusMessage()}
        </div>
        
        {/* Aide spécialisée pour les appels */}
        {connectionStatus === 'error' && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
            📞 <strong>Pendant un appel:</strong> Votre connexion vidéo/audio utilise déjà beaucoup de bande passante. 
            Le mode local préserve la qualité de votre appel tout en vous permettant d'éditer du code.
            Vous pourrez partager votre écran pour montrer le code aux autres participants.
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