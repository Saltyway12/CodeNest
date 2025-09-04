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

    // 2. WebRTC avec serveurs de signaling alternatifs et configuration améliorée
    const roomName = `call-${callId}-editor`;
    console.log("Connecting to room:", roomName);
    
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      maxConns: 20,
      filterBcConns: true,
      // Configuration WebRTC pour améliorer la connexion
      peerOpts: {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' }
          ],
          iceCandidatePoolSize: 10
        }
      }
    });
    
    providerRef.current = provider;

    // Debug: écouter les événements de connexion
    provider.on('status', event => {
      console.log('WebRTC status:', event.status);
      setConnectionStatus(event.status);
    });

    provider.on('peers', event => {
      console.log('Connected peers - added:', event.added, 'removed:', event.removed);
      setConnectedPeers(provider.room?.bcConns?.size || 0);
    });

    // Écouter les changements de connexion
    provider.on('synced', event => {
      console.log('Document synced:', event.synced);
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
    provider.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    });

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
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div>
      {/* Barre de statut de connexion */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className={getStatusColor(connectionStatus)}>
              {connectionStatus === 'connected' ? 'Connecté' : connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {connectedPeers} participant{connectedPeers !== 1 ? 's' : ''} connecté{connectedPeers !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="text-gray-500 text-xs">
          Room: {callId}
        </div>
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