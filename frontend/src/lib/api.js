import { axiosInstance } from "./axios";

/**
 * Service d'inscription utilisateur
 * Envoie les données de création de compte au serveur
 * @param {Object} signupData - Données d'inscription (email, password, fullName)
 * @returns {Promise<Object>} - Réponse du serveur avec données utilisateur
 */
export const signup = async (signupData) => {
	const response = await axiosInstance.post("/auth/inscription", signupData);
	return response.data;
};

/**
 * Service de connexion utilisateur
 * Authentifie l'utilisateur avec ses identifiants
 * @param {Object} loginData - Données de connexion (email, password)
 * @returns {Promise<Object>} - Réponse du serveur avec token et données utilisateur
 */
export const login = async (loginData) => {
	const response = await axiosInstance.post("/auth/connexion", loginData);
	return response.data;
};

/**
 * Service de déconnexion utilisateur
 * Invalide la session utilisateur côté serveur
 * @returns {Promise<Object>} - Confirmation de déconnexion
 */
export const logout = async () => {
	const response = await axiosInstance.post("/auth/deconnexion");
	return response.data;
};

/**
 * Service de récupération des données utilisateur authentifié
 * Récupère les informations du profil utilisateur connecté
 * @returns {Promise<Object|null>} - Données utilisateur ou null si erreur
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
 * Service de finalisation du profil utilisateur
 * Complète les informations obligatoires après inscription
 * @param {Object} userData - Données de profil (bio, langues, localisation)
 * @returns {Promise<Object>} - Profil utilisateur mis à jour
 */
export const completeOnboarding = async (userData) => {
	const response = await axiosInstance.post(
		"/auth/configuration-profil",
		userData
	);
	return response.data;
};

/**
 * Service de récupération de la liste d'amis
 * Retourne les amis de l'utilisateur connecté avec leurs informations
 * @returns {Promise<Array>} - Liste des amis avec données de profil
 */
export async function getUserFriends() {
	const response = await axiosInstance.get("/users/amis");
	return response.data;
}

/**
 * Service de récupération des utilisateurs recommandés
 * Retourne une liste d'utilisateurs suggérés pour nouvelles connexions
 * @returns {Promise<Array>} - Liste d'utilisateurs recommandés
 */
export async function getRecommendedUsers() {
	const response = await axiosInstance.get("/users");
	return response.data;
}

/**
 * Service de récupération des demandes d'amis envoyées
 * Retourne les demandes d'amitié émises par l'utilisateur en attente
 * @returns {Promise<Array>} - Liste des demandes sortantes
 */
export async function getOutgoingFriendReqs() {
	const response = await axiosInstance.get("/users/outgoing-friend-requests");
	return response.data;
}

/**
 * Service d'envoi de demande d'amitié
 * Crée une nouvelle demande d'ami vers un utilisateur spécifique
 * @param {string} userId - Identifiant de l'utilisateur destinataire
 * @returns {Promise<Object>} - Demande d'amitié créée
 */
export async function sendFriendRequest(userId) {
	const response = await axiosInstance.post(`/users/friend-request/${userId}`);
	return response.data;
}

/**
 * Service de récupération des demandes d'amis
 * Retourne les demandes reçues et acceptées pour l'utilisateur connecté
 * @returns {Promise<Object>} - Objet contenant demandes entrantes et acceptées
 */
export async function getFriendRequests() {
	const response = await axiosInstance.get("/users/friend-requests");
	return response.data;
}

/**
 * Service d'acceptation de demande d'amitié
 * Valide une demande d'ami reçue et établit la connexion
 * @param {string} requestId - Identifiant de la demande d'amitié
 * @returns {Promise<Object>} - Confirmation d'acceptation
 */
export async function acceptFriendRequest(requestId) {
	const response = await axiosInstance.put(
		`/users/friend-request/${requestId}/accept`
	);
	return response.data;
}

/**
 * Service de récupération du token Stream Chat
 * Génère un token d'authentification pour les services de chat/vidéo
 * @returns {Promise<Object>} - Token Stream pour authentification
 */
export async function getStreamToken() {
	const response = await axiosInstance.get("/chat/token");
	return response.data;
}
