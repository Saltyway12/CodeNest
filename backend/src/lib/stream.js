import { StreamChat } from "stream-chat";
import "dotenv/config";

// Récupération des clés d'authentification Stream depuis les variables d'environnement
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Vérification de la présence des clés d'authentification
if (!apiKey || !apiSecret) {
	console.error("Clé API ou clé secrète Stream manquante");
}

// Initialisation du client Stream Chat avec les clés d'authentification
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

/**
 * Création ou mise à jour d'un utilisateur sur Stream Chat
 * @param {Object} userData - Données de l'utilisateur (id, name, image, etc.)
 * @returns {Object} - Données de l'utilisateur traitées
 */
export const upsertStreamUser = async (userData) => {
	try {
		// Création/mise à jour de l'utilisateur via l'API Stream
		await streamClient.upsertUsers([userData]);
		return userData;
	} catch (error) {
		console.error(
			"Erreur lors de la création/mise à jour de l'utilisateur Stream :",
			error
		);
	}
};

/**
 * Génération d'un token d'authentification pour Stream Chat
 * @param {string|ObjectId} userId - Identifiant de l'utilisateur
 * @returns {string} - Token JWT signé pour l'authentification Stream
 */
export const generateStreamToken = (userId) => {
	try {
		// Conversion de l'ID en chaîne de caractères (requis par Stream)
		const userIdStr = userId.toString();

		// Génération et retour du token d'authentification
		return streamClient.createToken(userIdStr);
	} catch (error) {
		console.error("Erreur lors de la génération du token Stream :", error);
	}
};
