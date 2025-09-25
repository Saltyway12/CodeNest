import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware de protection des routes par authentification JWT
 * Vérifie la validité du token et attache l'utilisateur à la requête
 * @param {Request} req - Objet requête Express
 * @param {Response} res - Objet réponse Express
 * @param {NextFunction} next - Fonction de passage au middleware suivant
 */
export const protectRoute = async (req, res, next) => {
	try {
		// Extraction du token JWT depuis les cookies de la requête
		const token = req.cookies.jwt;

		// Vérification de la présence du token
		if (!token) {
			return res
				.status(401)
				.json({ message: "Non autorisé - Token non fourni" });
		}

		// Vérification et décodage du token avec la clé secrète
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

		// Validation de la structure du token décodé
		if (!decoded) {
			return res.status(401).json({ message: "Non autorisé - Token invalide" });
		}

		// Recherche de l'utilisateur en base de données via l'ID du token
		// Exclusion du champ password pour des raisons de sécurité
		const user = await User.findById(decoded.userId).select("-password");

		// Vérification de l'existence de l'utilisateur
		if (!user) {
			return res
				.status(401)
				.json({ message: "Non autorisé - Utilisateur introuvable" });
		}

		// Attachement de l'utilisateur à l'objet requête
		// Permet l'accès aux données utilisateur dans les contrôleurs suivants
		req.user = user;

		// Passage au middleware ou contrôleur suivant
		next();
	} catch (error) {
		// Gestion centralisée des erreurs d'authentification
		console.log("Erreur dans le middleware protectRoute", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
};
