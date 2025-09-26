import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

/**
 * Hook personnalisé pour la gestion de la déconnexion utilisateur
 * Utilise useMutation pour traiter la déconnexion avec invalidation de cache
 * Nettoie automatiquement les données utilisateur après déconnexion
 */
const useLogout = () => {
	const queryClient = useQueryClient();

	const {
		mutate: logoutMutation,
		isPending,
		error,
	} = useMutation({
		// Fonction API pour la déconnexion utilisateur
		mutationFn: logout,

		// Invalidation du cache utilisateur après déconnexion réussie
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
	});

	return {
		logoutMutation, // Fonction de déclenchement de la déconnexion
		isPending, // État de chargement de la requête
		error, // Objet d'erreur en cas d'échec
	};
};

export default useLogout;
