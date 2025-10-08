import { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getStreamToken } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';
import StreamChatContext from './StreamChatContext.js';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/**
 * Fournisseur React responsable de l'initialisation paresseuse et du cycle de
 * vie du client Stream Chat. Garantit qu'une seule instance est partagée entre
 * tous les consommateurs et qu'elle est déconnectée proprement lors du
 * démontage ou d'un changement d'utilisateur.
 */
export const StreamChatProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  const chatClientRef = useRef(null);
  const { authUser } = useAuthUser();

  // Récupération du token Stream pour l'utilisateur courant
  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Création puis mise en cache du client Stream
  useEffect(() => {
    if (!tokenData?.token || !authUser) {
      return () => {
        if (chatClientRef.current) {
          chatClientRef.current.disconnectUser();
          chatClientRef.current = null;
          setChatClient(null);
        }
      };
    }

    let isCancelled = false;
    let clientInstance;

    const initClient = async () => {
      if (chatClientRef.current) return;

      try {
        console.log('Initialisation du client Stream global...');

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        if (isCancelled) {
          client.disconnectUser();
          return;
        }

        clientInstance = client;
        chatClientRef.current = client;
        setChatClient(client);
        console.log('✅ Client Stream connecté');
      } catch (error) {
        console.error('Erreur initialisation Stream:', error);
      }
    };

    initClient();

    // Déconnexion à la sortie du provider
    return () => {
      isCancelled = true;
      const client = clientInstance ?? chatClientRef.current;

      if (client) {
        client.disconnectUser();
      }

      if (chatClientRef.current) {
        chatClientRef.current = null;
      }

      setChatClient(null);
    };
  }, [tokenData, authUser]);

  // Notification toast lors de la réception d'un message entrant
  useEffect(() => {
    const client = chatClientRef.current;
    if (!client || !authUser || typeof window === "undefined") return;

    const handleNewMessage = (event) => {
      const senderId = event.user?.id;
      const senderName = event.user?.name || 'Nouveau message';
      const preview = event.message?.text?.trim() || "Vous avez reçu un nouveau message.";

      if (!event.message || senderId === authUser._id) return;

      const channelId = event.cid?.split(':')[1] || '';
      const participantIds = channelId.split('-');
      const targetUserId = participantIds.find((id) => id && id !== authUser._id);

      if (targetUserId && window.location.pathname === `/chat/${targetUserId}`) {
        return;
      }

      toast.custom((t) => (
        <div
          className="bg-base-100 border border-base-300 shadow-xl rounded-lg p-4 flex flex-col gap-3 max-w-sm"
          role="status"
        >
          <div>
            <p className="font-semibold text-base-content">{senderName}</p>
            <p className="text-sm text-base-content/70 mt-1 break-words">
              {preview}
            </p>
          </div>
          {targetUserId && (
            <button
              type="button"
              className="btn btn-primary btn-sm self-start"
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = `/chat/${targetUserId}`;
              }}
            >
              Ouvrir le chat
            </button>
          )}
        </div>
      ), { duration: 5000 });
    };

    client.on('message.new', handleNewMessage);

    return () => {
      client.off('message.new', handleNewMessage);
    };
  }, [authUser]);

  return (
    <StreamChatContext.Provider value={{ chatClient }}>
      {children}
    </StreamChatContext.Provider>
  );
};
