import { VideoIcon } from "lucide-react";

/**
 * Composant bouton pour initier un appel vidéo
 * Affiché en position absolue dans l'en-tête du chat
 * @param {Function} handleVideoCall - Fonction callback pour démarrer l'appel vidéo
 */
function CallButton({ handleVideoCall }) {
  return (
    <div className="p-3 border-b flex items-center justify-end max-w-7xl mx-auto w-full absolute top-0">
      <button
        onClick={handleVideoCall}
        className="btn btn-primary btn-sm text-white gap-2"
        type="button"
        aria-label="Lancer un appel vidéo"
      >
        <VideoIcon className="size-5" />
        Appel vidéo
      </button>
    </div>
  );
}

export default CallButton;
