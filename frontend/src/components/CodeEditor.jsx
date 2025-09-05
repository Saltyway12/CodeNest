// CodeEditor.jsx
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { useParams } from "react-router";

const CodeEditor = () => {
  const { id: callId } = useParams(); // récupère l'ID d'appel (=> room Y.js)
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [connectedPeers, setConnectedPeers] = useState(0);

  useEffect(() => {
    // 1. Création du document Y.js (structure partagée)
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2. Création du provider WebSocket
    const roomName = `call-${callId}-editor`;
    console.log("Connecting to room:", roomName);

    // 👉 ici, on pointe vers ton backend Render qui héberge y-websocket
    const provider = new WebsocketProvider(
      "wss://codenest-go66.onrender.com", // ton backend Node sur Render
      roomName, // identifiant du document/room
      ydoc
    );
    providerRef.current = provider;

    // 🔹 Suivi de statut de connexion
    provider.on("status", (event) => {
      console.log("WebSocket status:", event.status);
      setConnectionStatus(event.status);
    });

    // 🔹 Suivi des peers connectés (approximation)
    provider.on("sync", (isSynced) => {
      console.log("Document synced:", isSynced);
    });

    return () => {
      // Nettoyage
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      provider.destroy();
      ydoc.destroy();
    };
  }, [callId]);

  // 3. Quand Monaco Editor est monté
  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = ydocRef.current;
    const provider = providerRef.current;
    if (!ydoc || !provider) return;

    const yText = ydoc.getText("monaco");

    // Liaison entre Y.Text et Monaco Editor
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness // awareness = gestion des curseurs/présence
    );
    bindingRef.current = binding;

    // Définir info utilisateur locale (pour curseurs colorés)
    provider.awareness.setLocalStateField("user", {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    });

    // Si document vide → insérer un snippet par défaut
    if (yText.length === 0) {
      const defaultSnippet = CODE_SNIPPETS[language] || "";
      yText.insert(0, defaultSnippet);
    }

    editor.focus();
  };

  // 4. Changement de langage
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

  // 5. Helpers pour l’affichage du statut
  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "disconnected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div>
      {/* Barre de statut */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className={getStatusColor(connectionStatus)}>
              {connectionStatus === "connected"
                ? "Connecté"
                : connectionStatus === "connecting"
                ? "Connexion..."
                : "Déconnecté"}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {/* Ici, connectedPeers est indicatif, tu pourras l'améliorer avec provider.awareness */}
            {connectedPeers} participant
            {connectedPeers !== 1 ? "s" : ""} connecté
            {connectedPeers !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-gray-500 text-xs">Room: {callId}</div>
      </div>

      <div className="flex gap-4">
        {/* Éditeur */}
        <div className="w-1/2">
          <LanguageSelector language={language} onSelect={onSelect} />
          <Editor
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: "selection",
              cursorBlinking: "smooth",
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            onMount={onMount}
          />
        </div>

        {/* Output */}
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
};

export default CodeEditor;
