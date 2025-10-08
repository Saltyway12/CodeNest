import { axiosInstance } from "./axios";

/**
 * Soumet les informations d'inscription vers l'API.
 *
 * @param {{ email: string, password: string, fullName: string }} signupData
 * @returns {Promise<object>}
 */
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/inscription", signupData);
  return response.data;
};

/**
 * Authentifie un utilisateur puis stocke la session via cookie HTTP-only.
 *
 * @param {{ email: string, password: string }} loginData
 * @returns {Promise<object>}
 */
export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/connexion", loginData);
  return response.data;
};

/**
 * Termine la session courante côté backend.
 *
 * @returns {Promise<object>}
 */
export const logout = async () => {
  const response = await axiosInstance.post("/auth/deconnexion");
  return response.data;
};

/**
 * Récupère les informations de l'utilisateur actuellement authentifié.
 * Renvoie `null` en cas de réponse 401 afin de simplifier la logique client.
 *
 * @returns {Promise<object|null>}
 */
export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/moi");
    return res.data;
  } catch (error) {
    console.log("Erreur API getAuthUser:", error);
    return null;
  }
};

/**
 * Complète les champs obligatoires du profil lors de l'onboarding.
 *
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/configuration-profil", userData);
  return response.data;
};

/**
 * Retourne la liste des amis déjà connectés à l'utilisateur.
 *
 * @returns {Promise<object>}
 */
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/amis");
  return response.data;
}

/**
 * Récupère les profils recommandés en fonction de la stratégie backend.
 */
export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

/**
 * Liste les demandes d'amis que l'utilisateur a envoyées et qui sont en
 * attente.
 */
export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

/**
 * Émet une nouvelle demande d'ami vers l'identifiant cible.
 */
export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

/**
 * Renvoie les demandes d'amis reçues ainsi que celles déjà acceptées.
 */
export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

/**
 * Accepte une demande d'ami spécifique et crée le lien côté backend.
 */
export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

/**
 * Sollicite un jeton Stream pour l'utilisateur connecté.
 */
export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}
