import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware d'authentification JWT qui valide le cookie de session, attache
 * l'utilisateur authentifié à la requête et rejette les accès non autorisés.
 * @param {Request} req - Requête Express entrante
 * @param {Response} res - Réponse Express sortante
 * @param {NextFunction} next - Callback vers le middleware suivant
 */
export const protectRoute = async (req, res, next) => {
        try {
                // Lit le cookie de session signé contenant le JWT.
                const token = req.cookies.jwt;

                // Rejette immédiatement la requête si aucun token n'est fourni.
                if (!token) {
                        return res
                                .status(401)
                                .json({ message: "Non autorisé - Token non fourni" });
                }

                // Valide la signature et extrait la charge utile du token.
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

                // S'assure que le token a été décodé correctement.
                if (!decoded) {
                        return res.status(401).json({ message: "Non autorisé - Token invalide" });
                }

                // Charge l'utilisateur associé tout en excluant le hash du mot de passe.
                const user = await User.findById(decoded.userId).select("-password");

                // Refuse l'accès si aucun utilisateur correspondant n'est trouvé.
                if (!user) {
                        return res
                                .status(401)
                                .json({ message: "Non autorisé - Utilisateur introuvable" });
                }

                // Attache l'utilisateur authentifié pour les traitements ultérieurs.
                req.user = user;

                // Poursuit la chaîne de middleware après validation réussie.
                next();
        } catch (error) {
                // Journalise l'erreur puis renvoie une réponse standardisée.
                console.log("Erreur dans le middleware protectRoute", error);
                res.status(500).json({ message: "Erreur interne du serveur" });
        }
};
