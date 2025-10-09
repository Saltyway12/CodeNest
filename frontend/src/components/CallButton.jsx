import { VideoIcon } from "lucide-react";

/**
 * Composant bouton pour initier un appel vidéo
 * S'adapte à la largeur disponible pour rester accessible sur mobile
 * @param {Function} handleVideoCall - Fonction callback pour démarrer l'appel vidéo
 */
function CallButton({ handleVideoCall }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-base-200 bg-base-100/95 p-3 backdrop-blur sm:justify-end">
      <button
        onClick={handleVideoCall}
        className="btn btn-primary btn-sm gap-2 text-white"
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
