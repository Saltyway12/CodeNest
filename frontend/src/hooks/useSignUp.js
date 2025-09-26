import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api";

/**
 * Hook personnalisé pour la gestion de l'inscription utilisateur
 * Utilise useMutation pour traiter la création de compte
 * Invalide automatiquement le cache utilisateur après succès
 */
const useSignUp = () => {
	const queryClient = useQueryClient();

	const { mutate, isPending, error } = useMutation({
		// Fonction API pour la création de compte utilisateur
		mutationFn: signup,

		// Invalidation du cache après inscription réussie
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
	});

	return {
		isPending, // État de chargement de la requête
		error, // Objet d'erreur en cas d'échec de création
		signupMutation: mutate, // Fonction de déclenchement de l'inscription
	};
};

export default useSignUp;
