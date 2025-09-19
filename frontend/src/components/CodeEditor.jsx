import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";
import { useParams } from "react-router";
import { useCollaborativeEditor } from "../hooks/useCollaborativeEditor";

const CodeEditor = () => {
  const { id: callId } = useParams();
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Hook personnalisé pour la collaboration
  const {
    connectionStatus,
    participantCount,
    sendDeltaChange,
    isApplyingRemoteChange,
    setApplyingRemoteChange,
    setOnInitialContent,
    setOnRemoteChange,
  } = useCollaborativeEditor(callId);

  // --------------------
  // GESTION CONTENU INITIAL
  // --------------------
  useEffect(() => {
    setOnInitialContent((content) => {
      if (!editorRef.current || !isEditorReady) return;
      
      console.log("📥 Réception contenu initial");
      setApplyingRemoteChange(true);
      
      const editor = editorRef.current;
      const model = editor.getModel();
      const initialContent = content || CODE_SNIPPETS[language] || "";
      
      model.setValue(initialContent);
      setApplyingRemoteChange(false);
    });
  }, [isEditorReady, language, setOnInitialContent, setApplyingRemoteChange]);

  // --------------------
  // GESTION CHANGEMENTS DISTANTS
  // --------------------
  useEffect(() => {
    setOnRemoteChange((changes) => {
      if (!editorRef.current || !isEditorReady) return;
      
      console.log("📥 Application delta distant:", changes);
      setApplyingRemoteChange(true);
      
      const editor = editorRef.current;
      const model = editor.getModel();
      
      try {
        const monacoEdits = changes.map(change => ({
          range: {
            startLineNumber: model.getPositionAt(change.rangeOffset).lineNumber,
            startColumn: model.getPositionAt(change.rangeOffset).column,
            endLineNumber: model.getPositionAt(change.rangeOffset + change.rangeLength).lineNumber,
            endColumn: model.getPositionAt(change.rangeOffset + change.rangeLength).column,
          },
          text: change.text,
        }));
        
        model.applyEdits(monacoEdits);
      } catch (error) {
        console.error("❌ Erreur application delta:", error);
      } finally {
        setApplyingRemoteChange(false);
      }
    });
  }, [isEditorReady, setOnRemoteChange, setApplyingRemoteChange]);

  // --------------------
  // MONTE DE L'EDITEUR
  // --------------------
  const onMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Écouter les changements
    editor.onDidChangeModelContent((event) => {
      if (isApplyingRemoteChange()) return;
      
      const changes = event.changes.map(change => ({
        rangeOffset: change.rangeOffset,
        rangeLength: change.rangeLength,
        text: change.text,
      }));
      
      if (changes.length > 0) {
        sendDeltaChange(changes);
      }
    });

    editor.focus();
    console.log("✅ Monaco Editor prêt");
  };

  // --------------------
  // CHANGEMENT DE LANGAGE
  // --------------------
  const onSelect = (lang) => {
    setLanguage(lang);
    
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const newSnippet = CODE_SNIPPETS[lang] || "";
    
    setApplyingRemoteChange(true);
    const model = editor.getModel();
    const fullRange = model.getFullModelRange();
    
    model.applyEdits([{
      range: fullRange,
      text: newSnippet,
    }]);
    
    setApplyingRemoteChange(false);
    
    // Envoyer le changement
    sendDeltaChange([{
      rangeOffset: 0,
      rangeLength: model.getValue().length - newSnippet.length,
      text: newSnippet,
    }]);
  };

  // --------------------
  // HELPERS UI
  // --------------------
  const getStatusColor = (status) => {
    switch (status) {
      case "connected": return "text-green-500";
      case "connecting": return "text-yellow-500";
      case "error": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "connected": return "Connecté";
      case "connecting": return "Connexion...";
      case "error": return "Erreur";
      default: return "Déconnecté";
    }
  };

  return (
    <div>
      {/* Header de statut */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus).replace("text-", "bg-")}`}
            />
            <span className={getStatusColor(connectionStatus)}>
              {getStatusText(connectionStatus)}
            </span>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400">
            {participantCount} participant{participantCount !== 1 ? "s" : ""} connecté{participantCount !== 1 ? "s" : ""}
          </div>
          
          {connectionStatus === "connected" && (
            <div className="text-xs text-green-600 dark:text-green-400">
              🔄 Synchro temps réel
            </div>
          )}
        </div>
        
        <div className="text-gray-500 text-xs">Room: {callId}</div>
      </div>

      {/* Layout principal */}
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
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
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