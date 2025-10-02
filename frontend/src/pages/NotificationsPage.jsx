import { useEffect, useState } from "react";
import { useStreamChat } from "../context/StreamChatContext.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests, acceptFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound.jsx";
import { Link } from "react-router-dom";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { chatClient } = useStreamChat();

  // --- FRIEND REQUESTS ---
  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // --- MESSAGES NOTIFS ---
  const [messageNotifs, setMessageNotifs] = useState({});
  // structure: { userId: { sender, count, lastMessage, lastDate } }

  useEffect(() => {
    if (!chatClient) return;

    const handleNewMessage = (event) => {
      if (event.message && event.user) {
        const sender = event.user;

        setMessageNotifs((prev) => {
          const existing = prev[sender.id] || {
            sender: {
              id: sender.id,
              name: sender.name,
              image: sender.image,
            },
            count: 0,
            lastMessage: null,
            lastDate: null,
          };

          return {
            ...prev,
            [sender.id]: {
              ...existing,
              count: existing.count + 1,
              lastMessage: event.message.text,
              lastDate: new Date(event.message.created_at),
            },
          };
        });
      }
    };

    chatClient.on("message.new", handleNewMessage);
    return () => chatClient.off("message.new", handleNewMessage);
  }, [chatClient]);

  const mergedNotifs = Object.values(messageNotifs);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* Demandes d'amis */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Demandes d'ami
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="avatar w-14 h-14 rounded-full bg-base-300">
                            <img src={req.sender.profilePic} alt={`Profil de ${req.sender.fullName}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{req.sender.fullName}</h3>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            acceptFriendRequest(req._id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
                              queryClient.invalidateQueries({ queryKey: ["friends"] });
                            })
                          }
                        >
                          Accepter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Connexions acceptées */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  Nouvelles connexions
                </h2>
                <div className="space-y-3">
                  {acceptedRequests.map((n) => (
                    <div key={n._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4 flex items-start gap-3">
                        <div className="avatar mt-1 size-10 rounded-full">
                          <img src={n.recipient.profilePic} alt={n.recipient.fullName} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{n.recipient.fullName}</h3>
                          <p className="text-sm my-1">
                            {n.recipient.fullName} a accepté votre demande d'ami !
                          </p>
                          <p className="text-xs flex items-center opacity-70">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            À l'instant
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Nouveaux messages regroupés par expéditeur */}
            {mergedNotifs.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5 text-info" />
                  Nouveaux messages
                </h2>
                <div className="space-y-3">
                  {mergedNotifs.map((notif) => (
                    <div key={notif.sender.id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4 flex items-start gap-3">
                        <div className="avatar mt-1 size-10 rounded-full">
                          <img src={notif.sender.image} alt={notif.sender.name} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{notif.sender.name}</h3>
                          <p className="text-sm my-1">
                            {notif.sender.name} t’a envoyé {notif.count} message
                            {notif.count > 1 ? "s" : ""}.
                          </p>
                          {notif.lastMessage && (
                            <p className="text-xs italic opacity-80">
                              Dernier : « {notif.lastMessage} »
                            </p>
                          )}
                          {notif.lastDate && (
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {notif.lastDate.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        {/* Bouton aller au chat */}
                        <Link
                          to={`/chat/${notif.sender.id}`}
                          className="btn btn-sm btn-outline btn-info"
                        >
                          Ouvrir le chat
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Aucun résultat */}
            {incomingRequests.length === 0 &&
              acceptedRequests.length === 0 &&
              mergedNotifs.length === 0 && <NoNotificationsFound />}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
