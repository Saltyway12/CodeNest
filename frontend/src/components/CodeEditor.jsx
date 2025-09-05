import { useRef, useState } from "react";
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

  const { ydoc, provider, connectedPeers, status } = useYjsProvider(
    `call-${callId}-editor`,
    "wss://codenest-go66.onrender.com"
  );

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (!ydoc || !provider) return;

    const yText = ydoc.getText("monaco");

    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    provider.awareness.setLocalStateField("user", {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)},70%,50%)`,
      cursor: null,
    });

    if (yText.length === 0) {
      const defaultSnippet = CODE_SNIPPETS[language] || "";
      yText.insert(0, defaultSnippet);
    }

    editor.focus();
  };

  const onSelect = (lang) => {
    setLanguage(lang);
    if (!ydoc) return;
    const yText = ydoc.getText("monaco");
    yText.delete(0, yText.length);
    yText.insert(0, CODE_SNIPPETS[lang] || "");
  };

  const getStatusColor = (s) =>
    s === "connected"
      ? "text-green-500"
      : s === "connecting"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div>
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status).replace("text-", "bg-")}`}></div>
            <span className={getStatusColor(status)}>
              {status === "connected"
                ? "Connecté"
                : status === "connecting"
                ? "Connexion..."
                : "Déconnecté"}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {connectedPeers} participant{connectedPeers !== 1 ? "s" : ""} connecté
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
