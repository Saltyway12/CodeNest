import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api.js";

/**
 * Hook personnalisé pour la gestion de l'utilisateur authentifié
 * Utilise React Query pour récupérer et mettre en cache les données utilisateur
 * Configure la requête sans retry pour éviter les tentatives répétées en cas d'échec d'auth
 */
const useAuthUser = () => {
	const authUser = useQuery({
		queryKey: ["authUser"], // Clé unique pour le cache des données utilisateur
		queryFn: getAuthUser, // Fonction API pour récupérer les informations utilisateur
		retry: false, // Désactivation des tentatives de retry pour l'authentification
	});

	return {
		isLoading: authUser.isLoading, // État de chargement de la requête d'authentification
		authUser: authUser.data?.user, // Données de l'utilisateur connecté ou undefined
	};
};

export default useAuthUser;
