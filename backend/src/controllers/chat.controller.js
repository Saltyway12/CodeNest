import { generateStreamToken } from "../lib/stream.js";

/**
 * Génère un token d'accès Stream Chat pour l'utilisateur authentifié afin de
 * permettre l'accès sécurisé aux fonctionnalités temps réel côté client.
 */
export async function getStreamToken(req, res) {
        try {
                // Crée un token Stream signé associé à l'identifiant utilisateur authentifié.
                const token = generateStreamToken(req.user.id);

                // Retourne le token afin que le client puisse s'authentifier auprès de Stream Chat.
                res.status(200).json({ token });
        } catch (error) {
                // Journalise l'erreur avec le contexte nécessaire au diagnostic.
                console.log("Erreur dans le contrôleur getStreamToken :", error.message);

                // Fournit une réponse générique pour éviter les fuites d'information.
                res.status(500).json({ message: "Erreur interne du serveur" });
        }
}
