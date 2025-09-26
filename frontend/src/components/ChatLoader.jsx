import { LoaderIcon } from "lucide-react";

/**
 * Composant d'écran de chargement pour la connexion au chat
 * Affiche un indicateur de chargement avec animation et message informatif
 */
function ChatLoader() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <LoaderIcon className="animate-spin size-10 text-primary" />
      <p className="mt-4 text-center text-lg font-mono">Connexion au chat...</p>
    </div>
  );
}

export default ChatLoader;