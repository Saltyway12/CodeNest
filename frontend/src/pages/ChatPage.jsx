import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/**
 * Page de chat intégrée avec Stream Chat SDK
 * Gère la messagerie temps réel entre utilisateurs
 * Inclut la fonctionnalité d'appels vidéo intégrés
 */
const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  // Récupération du token d'authentification Stream
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // Exécution conditionnelle basée sur la présence de l'utilisateur
  });

  // Initialisation du client de chat et du canal de communication
  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initialisation du client stream chat...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        // Connexion de l'utilisateur au service Stream Chat
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        // Génération d'un ID de canal unique et ordonné pour la conversation
        // Utilise le tri pour assurer la cohérence peu importe qui initie le chat
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // Création du canal de messagerie avec les participants
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        // Surveillance du canal pour recevoir les messages en temps réel
        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Erreur d'initialisation du chat:", error);
        toast.error("Impossible de se connecter au chat. Retentez un peu plus tard.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  /**
   * Gestionnaire d'appel vidéo
   * Envoie un lien d'appel vidéo dans le canal de chat
   */
  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/appel/${channel.id}`;

      // Envoi d'un message avec le lien d'appel
      channel.sendMessage({
        text: `J'ai commencé un appel vidéo. Rejoins moi ici: ${callUrl}`,
      });

      toast.success("Lien d'appel envoyé avec succès!");
    }
  };

  // Affichage du loader pendant l'initialisation
  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            {/* Bouton d'appel vidéo intégré */}
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              {/* En-tête du canal avec informations des participants */}
              <ChannelHeader />
              {/* Liste des messages avec défilement automatique */}
              <MessageList />
              {/* Zone de saisie de nouveaux messages */}
              <MessageInput focus />
            </Window>
          </div>
          {/* Fil de discussion pour les réponses aux messages */}
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;