import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        console.log("Initializing Stream video client...");
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });
        console.log("Joined call successfully");

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

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const [layout, setLayout] = useState("video-only"); // "video-only", "split", "code-only"

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header avec contrôles de layout */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <MessageSquareCode className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
            CodeNest
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLayout("video-only")}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              layout === "video-only"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video Only</span>
          </button>

          <button
            onClick={() => setLayout("split")}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              layout === "split"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <PanelLeft className="h-4 w-4" />
            <span>Split View</span>
          </button>

          <button
            onClick={() => setLayout("code-only")}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              layout === "code-only"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Code className="h-4 w-4" />
            <span>Code Only</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Vidéo */}
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

        {/* Section Éditeur de code */}
        {layout !== "video-only" && (
          <div
            className={`${
              layout === "split" ? "w-2/3 border-l border-gray-700" : "w-full"
            } bg-gray-800`}
          >
            <div className="h-full p-4">
              <CodeEditor />
            </div>
          </div>
        )}
      </div>

      {/* Contrôles d'appel toujours visibles en bas */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <CallControls />
      </div>
    </div>
  );
};

export default CallPage;
