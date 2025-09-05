// CodeEditor.jsx
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { useParams } from "react-router";

// --------------------
// Custom Provider pour ton serveur WebSocket
// --------------------
class CustomProvider {
  constructor(doc, url, roomName) {
    this.ydoc = doc;
    this.url = url;
    this.roomName = roomName;
    this.ws = null;
    this.awareness = { setLocalStateField: () => {} };
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(`${this.url}?room=${this.roomName}`);
    this.ws.binaryType = "arraybuffer";

    // Réception des updates du serveur
    this.ws.onmessage = (event) => {
      const update = new Uint8Array(event.data);
      Y.applyUpdate(this.ydoc, update);
    };

    // Envoi de l'état initial à l'ouverture
    this.ws.onopen = () => {
      console.log("CustomProvider connected");
      const update = Y.encodeStateAsUpdate(this.ydoc);
      this.ws.send(update);
    };

    this.ws.onclose = () => {
      console.log("CustomProvider disconnected");
    };
  }

  // Envoyer un update
  sendUpdate(update) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(update);
    }
  }

  destroy() {
    if (this.ws) this.ws.close();
  }
}

// --------------------
// Composant CodeEditor
// --------------------
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

  useEffect(() => {
    // 1️⃣ Création du document Y.js
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2️⃣ Connexion au serveur custom
    const roomName = `call-${callId}-editor`;
    console.log("Connecting to room:", roomName);

    const provider = new CustomProvider(
      "ws://localhost:3000", // ou ton URL Render "wss://codenest-go66.onrender.com"
      roomName
    );
    providerRef.current = provider;

    // 3️⃣ Observer les changements locaux et envoyer au serveur
    const yText = ydoc.getText("monaco");
    yText.observe(() => {
      const update = Y.encodeUpdate(ydoc);
      provider.sendUpdate(update);
    });

    setConnectionStatus("connected");

    return () => {
      // Nettoyage
      if (bindingRef.current) bindingRef.current.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [callId]);

  // 4️⃣ Quand Monaco est monté
  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const yText = ydoc.getText("monaco");

    // Liaison Y.Text <-> Monaco
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      providerRef.current.awareness
    );
    bindingRef.current = binding;

    // Info utilisateur locale
    providerRef.current.awareness.setLocalStateField("user", {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    });

    // Insérer snippet si vide
    if (yText.length === 0) {
      const defaultSnippet = CODE_SNIPPETS[language] || "";
      yText.insert(0, defaultSnippet);
    }

    editor.focus();
  };

  // 5️⃣ Changement de langage
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

  // 6️⃣ Couleurs statut
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
            {connectedPeers} participant
            {connectedPeers !== 1 ? "s" : ""} connecté
            {connectedPeers !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-gray-500 text-xs">Room: {callId}</div>
      </div>

      <div className="flex gap-4">
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

        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
};

export default CodeEditor;
