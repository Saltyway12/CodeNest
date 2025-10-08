import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

/**
 * Encapsule la mutation de déconnexion et applique l'invalidation du cache
 * `authUser` dès que la session serveur est détruite.
 */
const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return {
    logoutMutation,
    isPending,
    error,
  };
};

export default useLogout;
