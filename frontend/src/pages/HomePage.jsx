// Imports des hooks et utilitaires React Query pour la gestion des données
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Hooks React pour les effets et l'état local
import { useEffect, useState } from 'react';
// Import des fonctions API pour les requêtes au serveur
import { getOutgoingFriendReqs, getRecommendedUsers, getUserFriends, sendFriendRequest } from '../lib/api';
// Composant de navigation de React Router
import { Link } from "react-router";
// Icônes de Lucide React pour l'interface utilisateur
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";
// Fonction utilitaire pour capitaliser les chaînes de caractères
import { capitialize } from "../lib/utils";
// Composants personnalisés pour l'affichage
import FriendCard, { getLanguageFlag, getProgrammingLogo } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  // Client React Query pour gérer le cache et les requêtes
  const queryClient = useQueryClient();
  
  // État local pour stocker les IDs des demandes d'amis envoyées
  // Utilise un Set pour des recherches rapides (O(1))
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  // Requête pour récupérer la liste des amis de l'utilisateur
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"], // Clé unique pour identifier cette requête dans le cache
    queryFn: getUserFriends, // Fonction qui fait l'appel API
  });

  // Requête pour récupérer les utilisateurs recommandés
  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["recommendedUsers"], // Clé différente pour éviter les conflits
    queryFn: getRecommendedUsers,
  });

  // Requête pour récupérer les demandes d'amis sortantes (envoyées par l'utilisateur)
  const { data: outgoingFriendRequests } = useQuery({
    queryKey: ["outgoingFriendRequests"],
    queryFn: getOutgoingFriendReqs,
  });

  // Mutation pour envoyer une demande d'ami
  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest, // Fonction qui envoie la demande
    onSuccess: () => {
      // Après succès, on invalide les caches pour refraîchir les données
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
    },
  });

  // Effet qui s'exécute quand les demandes sortantes changent
  useEffect(() => {
    const outgoingIds = new Set();
    // Si on a des demandes sortantes
    if (outgoingFriendRequests && outgoingFriendRequests.length > 0) {
      // On extrait les IDs des destinataires et on les met dans un Set
      outgoingFriendRequests.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      // On met à jour l'état local avec ces IDs
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendRequests]); // Se déclenche quand outgoingFriendRequests change

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        
        {/* En-tête de la section "Vos amis" */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Vos amis</h2>
          {/* Bouton pour accéder aux demandes d'amis reçues */}
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Demandes d'amis
          </Link>
        </div>

        {/* Section d'affichage des amis */}
        {loadingFriends ? (
          // Spinner de chargement pendant la récupération des données
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          // Composant affiché quand l'utilisateur n'a pas d'amis
          <NoFriendsFound />
        ) : (
          // Grille responsive pour afficher les cartes d'amis
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        {/* Section "Élargissez votre cercle" pour les utilisateurs recommandés */}
        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Elargissez votre cercle</h2>
                <p className="opacity-70">
                  Trouvez des partenaires pour coder, échanger et progresser ensemble.
                </p>
              </div>
            </div>
          </div>

          {/* Affichage des utilisateurs recommandés */}
          {loadingUsers ? (
            // Spinner pendant le chargement
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            // Message quand aucun utilisateur n'est recommandé
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Pas de recommandations actuellement</h3>
              <p className="text-base-content opacity-70">
                Revenez plus tard pour découvrir de nouveaux utilisateurs!
              </p>
            </div>
          ) : (
            // Grille des utilisateurs recommandés
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                // Vérification si une demande a déjà été envoyée à cet utilisateur
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      
                      {/* Section profil utilisateur avec avatar et nom */}
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {/* Affichage conditionnel de la localisation */}
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges pour les langues native et apprise */}
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

                      {/* Biographie de l'utilisateur (affichage conditionnel) */}
                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Bouton pour envoyer une demande d'ami */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        }`}
                        // Appel de la mutation pour envoyer la demande
                        onClick={() => sendRequestMutation(user._id)}
                        // Désactivation si demande déjà envoyée ou en cours d'envoi
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          // État "demande envoyée"
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Demande envoyée
                          </>
                        ) : (
                          // État "envoyer demande"
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