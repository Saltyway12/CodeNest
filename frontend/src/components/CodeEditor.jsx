import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";
import { MonacoBinding } from "y-monaco";
import { useParams } from "react-router";
import { useYjsProvider } from "../hooks/useYjsProvider";

const CodeEditor = () => {
  const { id: callId } = useParams();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [users, setUsers] = useState([]);

  // ✅ Connexion Yjs via hook
  const { ydoc, provider, connectedPeers, status } = useYjsProvider(
    `call-${callId}-editor`,
    "wss://codenest-go66.onrender.com"
  );

  // Quand Monaco est monté
  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
  };

  // ✅ Lier Monaco ↔️ Yjs
  useEffect(() => {
    if (!isEditorReady || !ydoc || !provider || !editorRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const yText = ydoc.getText("monaco");

    // Détruire l’ancienne liaison
    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    // Créer la liaison collaborative
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Configurer l’état local pour awareness
    provider.awareness.setLocalState({
      user: {
        id: Math.random().toString(36).substring(2, 9),
        name: `User-${Math.floor(Math.random() * 1000)}`,
        color: `hsl(${Math.floor(Math.random() * 360)},70%,50%)`,
      },
      cursor: null,
    });

    // Initialiser le contenu seulement si vide
    if (yText.length === 0) {
      ydoc.transact(() => {
        yText.insert(0, CODE_SNIPPETS[language] || "");
      });
    }

    editor.focus();

    // Nettoyage à la destruction
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      provider.awareness.setLocalState(null);
    };
  }, [isEditorReady, ydoc, provider]);

  // ✅ Cleanup awareness quand on ferme l’onglet
  useEffect(() => {
    if (!provider) return;
    const handleUnload = () => {
      provider.awareness.setLocalState(null);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [provider]);

  // ✅ Suivre les participants connectés
  useEffect(() => {
    if (!provider) return;
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.map((s) => s.user).filter(Boolean));
    };
    provider.awareness.on("change", updateUsers);
    updateUsers();
    return () => provider.awareness.off("change", updateUsers);
  }, [provider]);

  // ✅ Changement de langage → recréer un modèle Monaco
  const onSelect = (lang) => {
    setLanguage(lang);
    if (!ydoc || !editorRef.current || !monacoRef.current || !provider) return;

    const yText = ydoc.getText("monaco");
    const newSnippet = CODE_SNIPPETS[lang] || "";

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newModel = monaco.editor.createModel(newSnippet, lang);
    editor.setModel(newModel);

    // Réattacher le binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
    }
    bindingRef.current = new MonacoBinding(
      yText,
      newModel,
      new Set([editor]),
      provider.awareness
    );
  };

  const getStatusColor = (s) =>
    s === "connected"
      ? "text-green-500"
      : s === "connecting"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div>
      {/* Header status */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(status).replace(
                "text-",
                "bg-"
              )}`}
            ></div>
            <span className={getStatusColor(status)}>
              {status === "connected"
                ? "Connecté"
                : status === "connecting"
                ? "Connexion..."
                : "Déconnecté"}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {connectedPeers} participant{connectedPeers !== 1 ? "s" : ""}{" "}
            connecté{connectedPeers !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-gray-500 text-xs">Room: {callId}</div>
      </div>

      {/* Liste des participants */}
      <div className="mb-4 flex flex-wrap gap-2">
        {users.map((u) => (
          <span
            key={u.id}
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: u.color, color: "#fff" }}
          >
            {u.name}
          </span>
        ))}
      </div>

      {/* Layout */}
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
              renderLineHighlight: "gutter",
              occurrencesHighlight: false,
              selectionHighlight: false,
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            onMount={onMount}
          />
        </div>

        {/* Output (exécution code) */}
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
};

export default CodeEditor;
