import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getOutgoingFriendReqs, getRecommendedUsers, getUserFriends, sendFriendRequest } from '../lib/api';
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { capitialize } from "../lib/utils";
import FriendCard, { getLanguageFlag, getProgrammingLogo } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

/**
 * Page d'accueil de l'application
 * Affiche la liste des amis existants et les recommandations d'utilisateurs
 * Gère les demandes d'amitié avec mise à jour temps réel du cache
 */
const HomePage = () => {
  const queryClient = useQueryClient();
  
  // Stockage des IDs de demandes d'amis envoyées pour optimiser les vérifications
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  // Requête pour récupérer les amis de l'utilisateur connecté
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Requête pour les utilisateurs suggérés (excluant amis actuels et utilisateur)
  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecommendedUsers,
  });

  // Requête pour les demandes d'amis sortantes en attente
  const { data: outgoingFriendRequests } = useQuery({
    queryKey: ["outgoingFriendRequests"],
    queryFn: getOutgoingFriendReqs,
  });

  // Mutation pour l'envoi de nouvelles demandes d'amitié
  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      // Invalidation des caches après succès pour rafraîchissement automatique
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
    },
  });

  // Mise à jour du Set des IDs de demandes envoyées pour UI réactive
  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendRequests && outgoingFriendRequests.length > 0) {
      outgoingFriendRequests.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendRequests]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        
        {/* Section des amis existants */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Vos amis</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Demandes d'amis
          </Link>
        </div>

        {/* Affichage conditionnel des amis selon l'état de chargement */}
        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        {/* Section des recommandations d'utilisateurs */}
        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Élargissez votre cercle</h2>
                <p className="opacity-70">
                  Trouvez des partenaires pour coder, échanger et progresser ensemble.
                </p>
              </div>
            </div>
          </div>

          {/* Grille des utilisateurs recommandés */}
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Pas de recommandations actuellement</h3>
              <p className="text-base-content opacity-70">
                Revenez plus tard pour découvrir de nouveaux utilisateurs!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                // Vérification de l'état des demandes pour cet utilisateur
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      
                      {/* Profil utilisateur avec avatar et informations de base */}
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

                      {/* Badges informatifs pour les langues */}
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

                      {/* Biographie utilisateur si disponible */}
                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Bouton d'action avec état dynamique */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        }`}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
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