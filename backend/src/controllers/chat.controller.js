import { generateStreamToken } from "../lib/stream.js";

/**
 * Contrôleur de génération de token Stream Chat
 * Génère un token d'authentification pour l'utilisateur connecté
 * permettant l'accès aux fonctionnalités de chat en temps réel
 */
export async function getStreamToken(req, res) {
	try {
		// Génération du token Stream basé sur l'ID utilisateur
		const token = generateStreamToken(req.user.id);

		// Retour du token au client pour l'authentification Stream
		res.status(200).json({ token });
	} catch (error) {
		// Logging de l'erreur pour le débogage
		console.log("Erreur dans le contrôleur getStreamToken :", error.message);

		// Réponse d'erreur générique au client
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}
