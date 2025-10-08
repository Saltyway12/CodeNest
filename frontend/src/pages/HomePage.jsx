import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight as ArrowRightIcon,
  BellRing as BellRingIcon,
  CheckCircle as CheckCircleIcon,
  MapPin as MapPinIcon,
  MessageCircle as MessageCircleIcon,
  Sparkles as SparklesIcon,
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
import { capitialize } from "../lib/utils";
import FriendCard, { getLanguageFlag, getProgrammingLogo } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

/**
 * Page d'accueil de l'application.
 * Réorganisée pour mettre en avant la collaboration et guider l'utilisateur
 * vers les actions prioritaires (messagerie, fonctionnalités et notifications).
 */
const HomePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(() => new Set());
  const [incomingRequestsIds, setIncomingRequestsIds] = useState(() => new Set());

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

  const { data: friendRequestsData } = useQuery({
    queryKey: ["friendRequests", "home"],
    queryFn: getFriendRequests,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  useEffect(() => {
    const nextIds = new Set();
    outgoingFriendRequests?.forEach((req) => {
      nextIds.add(req.recipient._id);
    });
    setOutgoingRequestsIds(nextIds);
  }, [outgoingFriendRequests]);

  useEffect(() => {
    const nextIncomingIds = new Set();
    const incomingReqs = friendRequestsData?.incomingReqs ?? [];

    incomingReqs.forEach((req) => {
      nextIncomingIds.add(req.sender._id);
    });

    setIncomingRequestsIds(nextIncomingIds);
  }, [friendRequestsData]);

  const handleOpenFeatures = () => navigate("/fonctionnalites");

  const handleOpenMessages = () => {
    if (friends.length > 0) {
      navigate(`/chat/${friends[0]._id}`);
      return;
    }

    navigate("/notifications");
  };

  const hasFriends = friends.length > 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-12">
        {/* Section de mise en avant */}
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr] items-stretch">
          <div className="card bg-gradient-to-br from-primary/20 via-primary/10 to-base-200 border border-primary/20">
            <div className="card-body p-6 sm:p-8 space-y-4">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <SparklesIcon className="size-4" />
                Collaboration en direct
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                Coopérez, échangez et progressez ensemble.
              </h1>
              <p className="text-base-content/80 max-w-2xl">
                Gérez vos projets depuis la messagerie : lancez un appel, partagez votre code
                en temps réel et organisez vos sessions avec votre communauté.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-outline" onClick={handleOpenFeatures}>
                  Explorer les fonctionnalités
                  <ArrowRightIcon className="size-4 ml-2" />
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleOpenMessages}>
                  Ouvrir la messagerie
                  <ArrowRightIcon className="size-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" />
                Raccourcis
              </h2>
              <div className="space-y-3 text-sm">
                <button
                  type="button"
                  className="btn btn-ghost justify-start w-full gap-2"
                  onClick={handleOpenMessages}
                >
                  <MessageCircleIcon className="size-4" />
                  {hasFriends ? "Continuer vos conversations" : "Découvrir vos notifications"}
                </button>
                <Link to="/notifications" className="btn btn-ghost justify-start w-full gap-2">
                  <BellRingIcon className="size-4" />
                  Gérer les demandes d'amis
                </Link>
                <Link to="/profil" className="btn btn-ghost justify-start w-full gap-2">
                  <CheckCircleIcon className="size-4" />
                  Mettre à jour votre profil
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Liste des amis existants */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Vos espaces de collaboration</h2>
              <p className="opacity-70">
                Retrouvez vos partenaires actuels pour coder, réviser et évoluer ensemble.
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

        {/* Recommandations d'utilisateurs */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Rencontrez de nouveaux binômes</h2>
            <p className="opacity-70">
              Trouvez des partenaires complémentaires selon vos langues parlées et vos objectifs techniques.
            </p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Pas de recommandations actuellement</h3>
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
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
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
                          Langue parlée: {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getProgrammingLogo(user.learningLanguage)}
                          Apprenant: {capitialize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      <button
                        type="button"
                        className="btn btn-primary w-full mt-2"
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || hasIncomingRequest || isPending}
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
