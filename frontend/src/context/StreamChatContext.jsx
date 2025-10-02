import { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import { getStreamToken } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const StreamChatContext = createContext(null);

/**
 * Provider pour le client Stream Chat global
 * Initialise et maintient une instance unique du client
 * Accessible partout dans l'application
 */
export const StreamChatProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  const { authUser } = useAuthUser();

  // Récupération du token Stream
  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initialisation du client Stream (une seule fois)
  useEffect(() => {
    const initClient = async () => {
      if (!tokenData?.token || !authUser || chatClient) return;

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

        setChatClient(client);
        console.log('✅ Client Stream connecté');
      } catch (error) {
        console.error('Erreur initialisation Stream:', error);
      }
    };

    initClient();

    // Cleanup : déconnexion lors du démontage
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
    };
  }, [tokenData, authUser]);

  return (
    <StreamChatContext.Provider value={{ chatClient }}>
      {children}
    </StreamChatContext.Provider>
  );
};

/**
 * Hook pour accéder au client Stream partout dans l'app
 */
export const useStreamChat = () => {
  const context = useContext(StreamChatContext);
  if (!context) {
    throw new Error('useStreamChat doit être utilisé dans StreamChatProvider');
  }
  return context;
};