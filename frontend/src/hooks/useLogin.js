import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api";

/**
 * Hook personnalisé pour la gestion de la connexion utilisateur
 * Utilise useMutation pour gérer l'authentification
 * Invalide le cache utilisateur après connexion réussie
 */
const useLogin = () => {
	const queryClient = useQueryClient();

	const { mutate, isPending, error } = useMutation({
		// Fonction API appelée lors de la tentative de connexion
		mutationFn: login,

		// Invalidation du cache pour forcer la récupération des données utilisateur
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
	});

	return {
		error, // Objet d'erreur en cas d'échec
		isPending, // État de chargement de la requête
		loginMutation: mutate, // Fonction de déclenchement de la connexion
	};
};

export default useLogin;
