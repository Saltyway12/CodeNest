import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants/constants";
import Output from "./Output";
import { useParams } from "react-router-dom";
import { useCollaborativeEditor } from "../hooks/useCollaborativeEditor";

/**
 * Composant principal de l'éditeur de code collaboratif
 * Intègre Monaco Editor avec synchronisation en temps réel via WebSocket
 * Gère les changements locaux et distants, la sélection de langage et l'exécution
 */
const CodeEditor = () => {
  const { id: callId } = useParams();
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Hook personnalisé pour la gestion de la collaboration WebSocket
  const {
    connectionStatus,
    participantCount,
    sendDeltaChange,
    sendLanguageChange,
    isApplyingRemoteChange,
    setApplyingRemoteChange,
    setOnInitialContent,
    setOnRemoteChange,
    setOnRemoteLanguageChange,
    reconnect,
  } = useCollaborativeEditor(callId);

  // Configuration du callback pour la réception du contenu initial
  useEffect(() => {
    setOnInitialContent((initialState) => {
      if (!editorRef.current || !isEditorReady) {
        return;
      }

      const incomingLanguage = initialState?.language || language;

      if (incomingLanguage && incomingLanguage !== language) {
        setLanguage(incomingLanguage);
      }

      setApplyingRemoteChange(true);

      try {
        const editor = editorRef.current;
        const model = editor.getModel();

        if (!model) {
          console.error("Modèle Monaco indisponible");
          return;
        }

        const resolvedLanguage = incomingLanguage || language;
        const initialContent =
          typeof initialState?.content === "string"
            ? initialState.content
            : CODE_SNIPPETS[resolvedLanguage] || "";
        model.setValue(initialContent);
      } catch (error) {
        console.error("Erreur application contenu initial:", error);
      } finally {
        setApplyingRemoteChange(false);
      }
    });
  }, [isEditorReady, language, setOnInitialContent, setApplyingRemoteChange]);

  // Configuration du callback pour l'application des changements distants
  useEffect(() => {
    setOnRemoteChange((changes) => {
      if (!editorRef.current || !isEditorReady) {
        return;
      }

      if (!Array.isArray(changes)) {
        console.error("Changes n'est pas un array:", changes);
        return;
      }

      setApplyingRemoteChange(true);

      try {
        const editor = editorRef.current;
        const model = editor.getModel();

        if (!model) {
          console.error("Modèle Monaco indisponible");
          return;
        }

        // Conversion des changements au format Monaco Editor
        const monacoEdits = changes
          .map((change) => {
            try {
              const startPos = model.getPositionAt(change.rangeOffset || 0);
              const endPos = model.getPositionAt(
                (change.rangeOffset || 0) + (change.rangeLength || 0),
              );

              return {
                range: {
                  startLineNumber: startPos.lineNumber,
                  startColumn: startPos.column,
                  endLineNumber: endPos.lineNumber,
                  endColumn: endPos.column,
                },
                text: change.text || "",
              };
            } catch (posError) {
              console.error("Erreur calcul position:", posError, change);
              return null;
            }
          })
          .filter((edit) => edit !== null);

        if (monacoEdits.length > 0) {
          model.applyEdits(monacoEdits);
        }
      } catch (error) {
        console.error("Erreur application delta:", error);
      } finally {
        setApplyingRemoteChange(false);
      }
    });
  }, [isEditorReady, setOnRemoteChange, setApplyingRemoteChange]);

  // Callback d'initialisation de l'éditeur Monaco
  const onMount = (editor) => {
    editorRef.current = editor;

    // Délai pour assurer la complète initialisation
    requestAnimationFrame(() => {
      setIsEditorReady(true);
    });

    // Configuration de l'écoute des changements de contenu
    editor.onDidChangeModelContent((event) => {
      if (isApplyingRemoteChange()) {
        return;
      }

      try {
        const changes = event.changes.map((change) => ({
          rangeOffset: change.rangeOffset || 0,
          rangeLength: change.rangeLength || 0,
          text: change.text || "",
        }));

        if (changes.length > 0) {
          sendDeltaChange(changes);
        }
      } catch (error) {
        console.error("Erreur traitement changement local:", error);
      }
    });

    editor.focus();
  };

  // Gestionnaire de changement de langage de programmation
  const onSelect = (lang) => {
    if (lang === language) return;

    setLanguage(lang);

    if (!editorRef.current || !isEditorReady) {
      return;
    }

    try {
      const editor = editorRef.current;
      const model = editor.getModel();

      if (!model) {
        console.error("Modèle Monaco indisponible");
        return;
      }

      const currentContent = model.getValue();
      const newSnippet = CODE_SNIPPETS[lang] || "";

      setApplyingRemoteChange(true);

      // Remplacement complet du contenu par le snippet du nouveau langage
      const fullRange = model.getFullModelRange();
      model.applyEdits([
        {
          range: fullRange,
          text: newSnippet,
        },
      ]);

      setApplyingRemoteChange(false);

      // Synchronisation du changement avec les autres clients
      const changeData = [
        {
          rangeOffset: 0,
          rangeLength: currentContent.length,
          text: newSnippet,
        },
      ];

      sendDeltaChange(changeData);
      sendLanguageChange(lang);
    } catch (error) {
      console.error("Erreur changement langage:", error);
    }
  };

  // Utilitaires pour l'affichage du statut de connexion
  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-success";
      case "connecting":
        return "text-warning";
      case "error":
        return "text-error";
      default:
        return "text-base-content/60";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connecté";
      case "connecting":
        return "Connexion...";
      case "error":
        return "Erreur";
      default:
        return "Déconnecté";
    }
  };

  useEffect(() => {
    setOnRemoteLanguageChange((remoteLanguage) => {
      if (!remoteLanguage || remoteLanguage === language) return;
      setLanguage(remoteLanguage);
    });
  }, [language, setOnRemoteLanguageChange]);

  // Protection contre l'absence d'ID d'appel
  if (!callId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">ID d'appel manquant</div>
      </div>
    );
  }

  return (
    <div>
      {/* Barre d'état de la collaboration */}
      <div className="mb-4 p-3 bg-base-200 rounded-lg flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus).replace("text-", "bg-")}`}
            />
            <span className={getStatusColor(connectionStatus)}>
              {getStatusText(connectionStatus)}
            </span>

            {/* Bouton de reconnexion en cas de problème */}
            {(connectionStatus === "error" ||
              connectionStatus === "disconnected") && (
              <button
                onClick={reconnect}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Relancer la connexion
              </button>
            )}
          </div>

          <div className="text-base-content/70">
            {participantCount} participant{participantCount !== 1 ? "s" : ""}{" "}
            connecté{participantCount !== 1 ? "s" : ""}
          </div>

          {connectionStatus === "connected" && (
            <div className="text-xs text-success">Synchronisation active</div>
          )}
        </div>

        <div className="text-base-content/60 text-xs">Room: {callId}</div>
      </div>

      {/* Layout principal avec éditeur et sortie */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-1/2">
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
            defaultValue={CODE_SNIPPETS[language]}
            onMount={onMount}
          />
        </div>
        <div className="w-full lg:w-1/2">
          <Output editorRef={editorRef} language={language} />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
