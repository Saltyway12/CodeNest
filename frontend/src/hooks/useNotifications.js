import { useEffect, useState } from "react";
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
  const [unreadChannels, setUnreadChannels] = useState([]);

  // Récupération des demandes d'amis via React Query
  const {
    data: friendRequests,
    isLoading: isLoadingFriendRequests,
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 30000,
  });

  const friendRequestsCount = friendRequests?.incomingReqs?.length ?? 0;

  useEffect(() => {
    const userId = streamClient?.userID;
    if (!streamClient || !userId) {
      setUnreadMessagesCount(0);
      setUnreadChannels([]);
      return undefined;
    }

    let isActive = true;

    const updateUnreadCount = async () => {
      try {
        const channels = await streamClient.queryChannels(
          { members: { $in: [userId] } },
          [{ last_message_at: -1 }],
          { state: true, watch: true, message_limit: 1 }
        );

        let aggregatedUnread = 0;

        const channelsWithUnread = channels
          .map((channel) => {
            const unreadForUser =
              channel?.state?.read?.[userId]?.unread_messages ?? 0;

            if (!unreadForUser) {
              return null;
            }

            aggregatedUnread += unreadForUser;

            const members = Object.values(channel?.state?.members ?? {});
            const otherMember = members.find(
              (member) => member?.user?.id && member.user.id !== userId
            )?.user;

            if (!otherMember) {
              return null;
            }

            const messages = channel?.state?.messages ?? [];
            const lastMessage = messages[messages.length - 1];
            const lastMessageAt =
              lastMessage?.created_at ??
              channel?.state?.last_message_at ??
              channel?.last_message_at ??
              null;

            return {
              cid: channel.cid,
              channelId: channel.id,
              unreadCount: unreadForUser,
              participant: {
                id: otherMember.id,
                name: otherMember.name || otherMember.id,
                image: otherMember.image,
              },
              lastMessageText: lastMessage?.text ?? "",
              lastMessageAt,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA;
          });

        if (isActive) {
          setUnreadMessagesCount(aggregatedUnread);
          setUnreadChannels(channelsWithUnread);
        }
      } catch (error) {
        console.error("Erreur récupération messages non lus:", error);
      }
    };

    updateUnreadCount();

    const handleNewMessage = () => updateUnreadCount();
    const handleMessageRead = () => updateUnreadCount();

    streamClient.on("message.new", handleNewMessage);
    streamClient.on("notification.message_new", handleNewMessage);
    streamClient.on("message.read", handleMessageRead);
    streamClient.on("notification.mark_read", handleMessageRead);

    return () => {
      isActive = false;
      streamClient.off("message.new", handleNewMessage);
      streamClient.off("notification.message_new", handleNewMessage);
      streamClient.off("message.read", handleMessageRead);
      streamClient.off("notification.mark_read", handleMessageRead);
    };
  }, [streamClient]);

  return {
    totalCount: friendRequestsCount + unreadMessagesCount,
    friendRequestsCount,
    unreadMessagesCount,
    unreadChannels,
    friendRequests,
    isLoadingFriendRequests,
  };
};
export default useNotifications;
