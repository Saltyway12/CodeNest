/**
 * ---------------------------------------------------------
 *  Auth Middleware (JWT-based)
 * ---------------------------------------------------------
 *  FR : Vérifie le token JWT présent dans le cookie httpOnly
 *       "jwt" ou dans l'en-tête Authorization. Protège les
 *       routes privées.
 *
 *  EN : Verifies JWT token from "jwt" httpOnly cookie or
 *       Authorization header. Protects private routes.
 * ---------------------------------------------------------
 */

import { verifyJwt } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
	try {
		const cookieToken = req.cookies?.jwt;

		const authHeader = req.headers["authorization"];
		const headerToken = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		const token = cookieToken || headerToken;

		if (!token) {
			return res.status(401).json({ error: "Unauthorized: missing token" });
		}

		const payload = verifyJwt(token);

		// FR : On expose l'ID utilisateur aux contrôleurs.
		// EN : Expose user ID to controllers.
		req.userId = payload.sub;

		next();
	} catch (err) {
		return res.status(401).json({ error: "Unauthorized: invalid token" });
	}
}
