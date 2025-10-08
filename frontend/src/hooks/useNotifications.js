import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

/**
 * Calcule le nombre de notifications à afficher en combinant les demandes
 * d'amis et les messages non lus Stream. Le hook synchronise périodiquement les
 * requêtes HTTP et s'abonne en temps réel aux événements Stream pertinents.
 *
 * @param {import('stream-chat').StreamChat | null} streamClient - Instance
 *   connectée du client Stream Chat.
 */
export const useNotifications = (streamClient) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Récupération des demandes d'amis via React Query
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 30000,
  });

  const friendRequestsCount = friendRequests?.incomingReqs?.length ?? 0;

  useEffect(() => {
    const userId = streamClient?.userID;
    if (!streamClient || !userId) {
      return undefined;
    }

    let isActive = true;

    const updateUnreadCount = async () => {
      try {
        const channels = await streamClient.queryChannels(
          { members: { $in: [userId] } },
          {},
          { state: true, watch: true }
        );

        const total = channels.reduce((sum, channel) => {
          const unreadForUser = channel?.state?.read?.[userId]?.unread_messages ?? 0;
          return sum + unreadForUser;
        }, 0);

        if (isActive) {
          setUnreadMessagesCount(total);
        }
      } catch (error) {
        console.error("Erreur récupération messages non lus:", error);
      }
    };

    updateUnreadCount();

    const handleNewMessage = () => updateUnreadCount();
    const handleMessageRead = () => updateUnreadCount();

    streamClient.on("message.new", handleNewMessage);
    streamClient.on("message.read", handleMessageRead);
    streamClient.on("notification.mark_read", handleMessageRead);

    return () => {
      isActive = false;
      streamClient.off("message.new", handleNewMessage);
      streamClient.off("message.read", handleMessageRead);
      streamClient.off("notification.mark_read", handleMessageRead);
    };
  }, [streamClient]);

  return {
    totalCount: friendRequestsCount + unreadMessagesCount,
    friendRequestsCount,
    unreadMessagesCount,
  };
};
export default useNotifications;
