/**
 * ---------------------------------------------------------
 *  Stream Chat Client
 * ---------------------------------------------------------
 *  FR : Client serveur pour l'intégration avec Stream Chat.
 *       - Gestion des utilisateurs (upsert / delete)
 *       - Génération de token côté serveur
 *
 *  EN : Server-side client for Stream Chat integration.
 *       - User management (upsert / delete)
 *       - Server-side auth token generation
 * ---------------------------------------------------------
 */

import { StreamChat } from "stream-chat";

// FR : Lecture des identifiants depuis les variables d'environnement.
// EN : Read Stream API credentials from environment variables.
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
	// FR : On casse dès le démarrage : sans ces clés, le service est inutilisable.
	// EN : Fail fast at startup: without these keys, the service is unusable.
	throw new Error(
		"Missing STREAM_API_KEY or STREAM_API_SECRET environment variables"
	);
}

// FR : Client serveur unique Stream Chat.
// EN : Singleton server-side Stream Chat client.
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

/**
 * ---------------------------------------------------------
 *  upsertStreamUser
 * ---------------------------------------------------------
 *  FR : Crée ou met à jour un utilisateur côté Stream Chat.
 *       Si l'opération échoue, l'erreur est remontée afin
 *       que l'appelant puisse réagir (rollback, log, etc.).
 *
 *  EN : Creates or updates a user on Stream Chat. If the
 *       operation fails, the error is thrown so the caller
 *       can react (rollback, log, etc.).
 * ---------------------------------------------------------
 */
export const upsertStreamUser = async (userData) => {
	try {
		await streamClient.upsertUsers([userData]);
		return userData;
	} catch (error) {
		console.error("Erreur Stream (upsertStreamUser):", error);
		throw error;
	}
};

/**
 * ---------------------------------------------------------
 *  deleteStreamUser
 * ---------------------------------------------------------
 *  FR : Supprime un utilisateur côté Stream Chat afin d'éviter
 *       les comptes orphelins. En cas d'échec, on log et on
 *       remonte l'erreur pour laisser le contrôleur décider.
 *
 *  EN : Deletes a user on Stream Chat to avoid orphaned
 *       accounts. On failure, logs and rethrows so the
 *       controller can decide how to handle it.
 * ---------------------------------------------------------
 */
export const deleteStreamUser = async (userId) => {
	try {
		const userIdStr = userId.toString();

		await streamClient.deleteUser(userIdStr, {
			mark_messages_deleted: true,
			hard_delete: true,
		});
	} catch (error) {
		console.error("Erreur Stream (deleteStreamUser):", error);
		// Possibilité : ne pas rethrow si on considère que la suppression locale suffit.
		// Ici on choisit de remonter pour être strict.
		throw error;
	}
};

/**
 * ---------------------------------------------------------
 *  generateStreamToken
 * ---------------------------------------------------------
 *  FR : Génère un token d'authentification Stream Chat pour
 *       un utilisateur donné. Ce token est ensuite envoyé
 *       au client afin qu'il se connecte à Stream.
 *
 *  EN : Generates a Stream Chat auth token for a given user.
 *       This token is then sent to the client so it can
 *       connect to Stream.
 * ---------------------------------------------------------
 */
export const generateStreamToken = (userId) => {
	try {
		const userIdStr = userId.toString();
		return streamClient.createToken(userIdStr);
	} catch (error) {
		console.error("Erreur Stream (generateStreamToken):", error);
		throw error;
	}
};
