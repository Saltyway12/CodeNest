import { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import { getStreamToken } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';
import StreamChatContext from './StreamChatContext.js';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/**
 * Provider pour le client Stream Chat global
 * Initialise et maintient une instance unique du client
 * Accessible partout dans l'application
 */
export const StreamChatProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  const chatClientRef = useRef(null);
  const { authUser } = useAuthUser();

  // Récupération du token Stream
  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initialisation du client Stream (une seule fois)
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

    // Cleanup : déconnexion lors du démontage
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

  return (
    <StreamChatContext.Provider value={{ chatClient }}>
      {children}
    </StreamChatContext.Provider>
  );
};
