import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { executeCode } from "../store/executeCode";
import toast from "react-hot-toast";

/**
 * Composant de sortie et d'exécution de code
 * Permet d'exécuter le code de l'éditeur et d'afficher les résultats
 * Utilise react-hot-toast pour les notifications d'erreur
 * @param {Object} editorRef - Référence à l'instance Monaco Editor
 * @param {string} language - Langage de programmation actuel
 */
const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Exécution du code via l'API externe
  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Impossible d'exécuter le code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-1/2">
      <p className="mb-2 text-lg">Output</p>
      
      {/* Bouton d'exécution */}
      <button
        className={`flex items-center gap-2 px-4 py-2 mb-4 border-2 border-green-500 text-green-500 rounded-md hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isLoading ? "opacity-50" : ""
        }`}
        onClick={runCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isLoading ? "Exécution..." : "Exécuter le Code"}
      </button>

      {/* Zone d'affichage des résultats */}
      <div
        className={`h-[75vh] p-2 border rounded border-solid ${
          isError 
            ? "text-red-400 border-red-500" 
            : "text-white border-gray-600"
        } bg-gray-900`}
      >
        {output
          ? output.map((line, i) => (
              <p key={i} className="font-mono text-sm">
                {line}
              </p>
            ))
          : 'Cliquez sur "Exécuter le Code" pour voir la sortie ici'}
      </div>
    </div>
  );
};

export default Output;