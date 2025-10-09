import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle as CheckCircleIcon,
  MapPin as MapPinIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
} from "lucide-react";
import {
  getFriendRequests,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { capitalize } from "../lib/utils";
import FriendCard, {
  getLanguageFlag,
  getProgrammingLogo,
} from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

/**
 * Page d'accueil de l'application
 * Focalisée sur le suivi des collaborations existantes et les recommandations de binômes
 */
const HomePage = () => {
  const queryClient = useQueryClient();

  // Stockage des IDs de demandes d'amis envoyées pour optimiser les vérifications
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(
    () => new Set(),
  );
  const [incomingRequestsIds, setIncomingRequestsIds] = useState(
    () => new Set(),
  );

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendRequests } = useQuery({
    queryKey: ["outgoingFriendRequests"],
    queryFn: getOutgoingFriendReqs,
  });

  // Requête pour les demandes entrantes
  const { data: friendRequestsData } = useQuery({
    queryKey: ["friendRequests", "home"],
    queryFn: getFriendRequests,
  });

  // Mutation pour l'envoi de nouvelles demandes d'amitié
  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const hasFriends = useMemo(() => friends.length > 0, [friends.length]);

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendRequests && outgoingFriendRequests.length > 0) {
      outgoingFriendRequests.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
    }
    setOutgoingRequestsIds(outgoingIds);
  }, [outgoingFriendRequests]);

  useEffect(() => {
    const incoming = friendRequestsData?.incomingReqs ?? [];
    const incomingIds = new Set();

    incoming.forEach((req) => {
      incomingIds.add(req.sender._id);
    });

    setIncomingRequestsIds(incomingIds);
  }, [friendRequestsData]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-12">
        {/* Section des amis existants */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Vos espaces de collaboration
              </h2>
              <p className="opacity-70">
                Retrouvez vos partenaires actuels pour coder, réviser et évoluer
                ensemble.
              </p>
            </div>
            <Link to="/notifications" className="btn btn-outline btn-sm">
              <UsersIcon className="mr-2 size-4" />
              Demandes d'amis
            </Link>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : hasFriends ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {friends.map((friend) => (
                <FriendCard key={friend._id} friend={friend} />
              ))}
            </div>
          ) : (
            <NoFriendsFound />
          )}
        </section>

        {/* Section des recommandations d'utilisateurs */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Rencontrez de nouveaux binômes
            </h2>
            <p className="opacity-70">
              Trouvez des partenaires complémentaires selon vos langues parlées
              et vos objectifs techniques.
            </p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                Pas de recommandations actuellement
              </h3>
              <p className="text-base-content/70">
                Revenez plus tard pour découvrir de nouveaux utilisateurs !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                const hasIncomingRequest = incomingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 border border-base-300 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      {/* Profil utilisateur avec avatar et informations de base */}
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">
                            {user.fullName}
                          </h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Langue parlée: {capitalize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getProgrammingLogo(user.learningLanguage)}
                          Apprenant: {capitalize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && (
                        <p className="text-sm opacity-70">{user.bio}</p>
                      )}

                      <button
                        className="btn btn-primary w-full mt-2"
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={
                          hasRequestBeenSent || hasIncomingRequest || isPending
                        }
                      >
                        {hasIncomingRequest ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Demande reçue
                          </>
                        ) : hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Demande envoyée
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Envoyer une demande d'ami
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
