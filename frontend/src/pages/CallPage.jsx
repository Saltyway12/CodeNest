import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import CodeEditor from "../components/CodeEditor";
import { Code, Video, PanelLeft, MessageSquareCode } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/**
 * Page d'appel vidéo avec fonctionnalités de programmation collaborative
 * Intègre Stream Video SDK pour les communications temps réel
 * Propose différents modes d'affichage (vidéo seule, partagé, code seul)
 */
const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { authUser, isLoading } = useAuthUser();

  // Récupération du token Stream pour l'authentification
  const { data: tokenData, error: tokenError } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initialisation de la connexion à l'appel Stream Video
  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        // Configuration du client Stream Video avec authentification
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        // Création et connexion à l'appel
        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Impossible de rejoindre l'appel. Veuillez réessayer.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, authUser, callId]);

  useEffect(() => {
    if (tokenError) {
      console.error("Erreur lors de la récupération du token Stream Video:", tokenError);
      toast.error("Le service d'appel vidéo est momentanément indisponible.");
    }
  }, [tokenError]);

  // Affichage du loader pendant l'initialisation
  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col">
      {client && call ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallContent />
          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p>Could not initialize call. Please refresh or try again later.</p>
        </div>
      )}
    </div>
  );
};

/**
 * Composant de contenu de l'appel avec interface utilisateur complète
 * Gère les différents modes d'affichage et la logique de déconnexion
 */
const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const [layout, setLayout] = useState("video-only"); // États : "video-only", "split", "code-only"

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/", { replace: true });
    }
  }, [callingState, navigate]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* En-tête avec logo et contrôles de mise en page */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <MessageSquareCode className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
            CodeNest
          </span>
        </div>

        {/* Boutons de sélection du mode d'affichage */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLayout("video-only")}
            className={`btn btn-sm gap-2 ${layout === "video-only" ? "btn-primary" : "btn-ghost"}`}
          >
            <Video className="h-4 w-4" />
            <span>Vidéo</span>
          </button>

          <button
            type="button"
            onClick={() => setLayout("split")}
            className={`btn btn-sm gap-2 ${layout === "split" ? "btn-primary" : "btn-ghost"}`}
          >
            <PanelLeft className="h-4 w-4" />
            <span>Vue partagée</span>
          </button>

          <button
            type="button"
            onClick={() => setLayout("code-only")}
            className={`btn btn-sm gap-2 ${layout === "code-only" ? "btn-primary" : "btn-ghost"}`}
          >
            <Code className="h-4 w-4" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Zone de contenu principal avec disposition dynamique */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section vidéo - masquée en mode "code uniquement" */}
        {layout !== "code-only" && (
          <div
            className={`${
              layout === "split" ? "w-1/3" : "w-full"
            } bg-gray-900`}
          >
            <StreamTheme>
              <SpeakerLayout />
            </StreamTheme>
          </div>
        )}

        {/* Section éditeur de code - masquée en mode "vidéo uniquement" */}
        {layout !== "video-only" && (
          <div
            className={`${
              layout === "split"
                ? "w-2/3 border-l border-gray-700"
                : "w-full"
            } bg-gray-800`}
          >
            <div className="h-full p-4">
              <CodeEditor />
            </div>
          </div>
        )}
      </div>

      {/* Barre de contrôles d'appel en bas */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <StreamTheme>
          <CallControls />
        </StreamTheme>
      </div>
    </div>
  );
};

export default CallPage;
