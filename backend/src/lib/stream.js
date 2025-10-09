import { StreamChat } from "stream-chat";
import "dotenv/config";

// Lit les identifiants d'API Stream Chat depuis les variables d'environnement.
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Alerte au démarrage lorsque les identifiants indispensables sont manquants.
if (!apiKey || !apiSecret) {
        console.error("Clé API ou clé secrète Stream manquante");
}

// Instancie le client serveur Stream Chat en utilisant les identifiants fournis.
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

/**
 * Crée ou met à jour un utilisateur sur Stream Chat afin de maintenir la
 * cohérence entre la base locale et le service temps réel.
 * @param {Object} userData - Données de l'utilisateur (id, name, image, etc.)
 * @returns {Object} - Données de l'utilisateur traitées
 */
export const upsertStreamUser = async (userData) => {
        try {
                // Transmet le profil utilisateur au service Stream via upsertUsers.
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
 * Supprime l'utilisateur côté Stream Chat afin d'éviter les comptes orphelins.
 * En cas d'échec, l'erreur est simplement journalisée pour ne pas bloquer
 * la suppression locale du compte.
 *
 * @param {string|ObjectId} userId - Identifiant de l'utilisateur à supprimer
 */
export const deleteStreamUser = async (userId) => {
        try {
                const userIdStr = userId.toString();
                await streamClient.deleteUser(userIdStr, {
                        mark_messages_deleted: true,
                        hard_delete: true,
                });
        } catch (error) {
                console.error(
                        "Erreur lors de la suppression de l'utilisateur Stream :",
                        error
                );
        }
};

/**
 * Génère un token d'authentification Stream Chat destiné au client.
 * @param {string|ObjectId} userId - Identifiant de l'utilisateur
 * @returns {string} - Token JWT signé pour l'authentification Stream
 */
export const generateStreamToken = (userId) => {
        try {
                // Convertit l'identifiant en chaîne de caractères pour respecter l'API Stream.
                const userIdStr = userId.toString();

                // Retourne le token signé que le client utilisera pour se connecter à Stream Chat.
                return streamClient.createToken(userIdStr);
        } catch (error) {
                console.error("Erreur lors de la génération du token Stream :", error);
        }
};
