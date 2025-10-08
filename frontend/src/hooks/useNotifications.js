import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

/**
 * Hook qui combine les notifications de demandes d'amis et messages Stream
 * @param {Object} streamClient - Instance du client Stream Chat
 * @returns {Object} { totalCount, friendRequestsCount, unreadMessagesCount }
 */
export const useNotifications = (streamClient) => {
        const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

        // Récupération des demandes d'amis via React Query
        const { data: friendRequests } = useQuery({
                queryKey: ["friendRequests"],
                queryFn: getFriendRequests,
                refetchInterval: 30000, // Rafraîchit toutes les 30 secondes
        });

        const friendRequestsCount = friendRequests?.incomingReqs?.length || 0;

        // Écoute des messages non lus Stream en temps réel
        useEffect(() => {
                const userId = streamClient?.userID;
                if (!streamClient || !userId) return undefined;

                let isActive = true;

                const updateUnreadCount = async () => {
                        try {
                                // Récupère tous les channels de l'utilisateur
                                const channels = await streamClient.queryChannels(
                                        { members: { $in: [userId] } },
                                        {},
                                        { state: true, watch: true }
                                );

                                // Calcule le total des messages non lus
                                const total = channels.reduce((sum, channel) => {
                                        const unreadForUser =
                                                channel?.state?.read?.[userId]?.unread_messages || 0;

                                        return sum + unreadForUser;
                                }, 0);

                                if (isActive) {
                                        setUnreadMessagesCount(total);
                                }
                        } catch (error) {
                                console.error("Erreur récupération messages non lus:", error);
                        }
                };

                // Mise à jour initiale
                updateUnreadCount();

                // Écoute des événements Stream en temps réel
                const handleNewMessage = () => updateUnreadCount();
                const handleMessageRead = () => updateUnreadCount();

                streamClient.on("message.new", handleNewMessage);
                streamClient.on("message.read", handleMessageRead);
                streamClient.on("notification.mark_read", handleMessageRead);

                // Cleanup des listeners
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
