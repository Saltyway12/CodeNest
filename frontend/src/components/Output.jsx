import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { executeCode } from "../store/executeCode";

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

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
      showToast(error.message || "Unable to run code", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-1/2">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-md shadow-lg ${
            toast.type === "error" 
              ? "bg-red-600 text-white" 
              : "bg-green-600 text-white"
          }`}>
            <p className="font-medium">An error occurred.</p>
            <p className="text-sm opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      <p className="mb-2 text-lg">Output</p>
      
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
        {isLoading ? "Running..." : "Run Code"}
      </button>

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
          : 'Click "Run Code" to see the output here'}
      </div>
    </div>
  );
};

export default Output;