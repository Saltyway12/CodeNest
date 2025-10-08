import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api.js";

/**
 * Hook d'accès à l'utilisateur authentifié reposant sur React Query. La
 * requête est explicitement configurée sans retry pour éviter les boucles de
 * reconnexion côté client lorsque le backend renvoie une erreur d'auth.
 */
const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"], // Stockage unique dans le cache
    queryFn: getAuthUser,
    retry: false,
  });

  return {
    isLoading: authUser.isLoading,
    authUser: authUser.data?.user ?? null,
  };
};

export default useAuthUser;
