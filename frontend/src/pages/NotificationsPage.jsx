import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { acceptFriendRequest } from "../lib/api";
import NoNotificationsFound from "../components/NoNotificationsFound.jsx";
import useStreamChat from "../context/useStreamChat";
import { useNotifications } from "../hooks/useNotifications";

/**
 * Page de gestion des notifications et demandes d'amitié
 * Affiche les demandes reçues et les nouvelles connexions acceptées
 * Permet l'acceptation des demandes avec mise à jour temps réel
 */
const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { chatClient } = useStreamChat();
  const {
    friendRequests,
    unreadChannels,
    unreadMessagesCount,
    isLoadingFriendRequests,
  } = useNotifications(chatClient);

  // Mutation pour accepter une demande d'amitié
  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      // Invalidation des caches pour mise à jour automatique de l'interface
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  const hasNotifications =
    incomingRequests.length > 0 ||
    acceptedRequests.length > 0 ||
    (unreadChannels?.length ?? 0) > 0;

  const formatMessageDate = (date) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoadingFriendRequests ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* Section des messages non lus */}
            {unreadChannels?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5 text-accent" />
                  Messages non lus
                  <span className="badge badge-accent ml-2">
                    {unreadMessagesCount}
                  </span>
                </h2>

                <div className="space-y-3">
                  {unreadChannels.map((channel) => {
                    const preview = channel.lastMessageText?.trim();
                    const truncatedPreview = preview
                      ? preview.length > 120
                        ? `${preview.slice(0, 117)}...`
                        : preview
                      : "Vous avez reçu un nouveau message.";

                    return (
                      <div
                        key={channel.cid}
                        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-start gap-3">
                            <div className="avatar mt-1 size-12 rounded-full">
                              <img
                                src={channel.participant?.image}
                                alt={channel.participant?.name}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2 justify-between">
                                <div>
                                  <h3 className="font-semibold">
                                    {channel.participant?.name || "Conversation"}
                                  </h3>
                                  <p className="text-xs opacity-70">
                                    Dernier message : {formatMessageDate(channel.lastMessageAt)}
                                  </p>
                                </div>
                                <span className="badge badge-primary">
                                  {channel.unreadCount} nouveau{channel.unreadCount > 1 ? "x" : ""} message{channel.unreadCount > 1 ? "s" : ""}
                                </span>
                              </div>

                              <p className="text-sm text-base-content/80">
                                {truncatedPreview}
                              </p>

                              {channel.participant?.id && (
                                <div className="flex justify-end">
                                  <Link
                                    to={`/chat/${channel.participant.id}`}
                                    className="btn btn-sm btn-outline"
                                  >
                                    Ouvrir la conversation
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section des demandes d'amitié reçues */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Demandes d'ami
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Langue parlée: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Apprenant: {request.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            Accepter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section des nouvelles connexions acceptées */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  Nouvelles connexions
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} a accepté votre demande d'ami. Vous pouvez maintenant communiquer avec eux !
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              À l'instant
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            Nouvel(le) ami(e)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Affichage si aucune notification disponible */}
            {!hasNotifications && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
