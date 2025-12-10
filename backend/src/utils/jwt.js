/**
 * ---------------------------------------------------------
 *  JWT Utility
 * ---------------------------------------------------------
 *  FR : Fonctions utilitaires pour générer et vérifier des
 *       tokens JWT signés. Centralise la logique afin de
 *       garder les contrôleurs et middlewares propres.
 *
 *  EN : Utility functions to generate and verify signed
 *       JWT tokens. Centralizes logic to keep controllers
 *       and middlewares clean.
 * ---------------------------------------------------------
 */

import jwt from "jsonwebtoken";

/**
 * FR : Génère un token JWT pour un utilisateur donné.
 * EN : Generates a JWT token for a given user.
 */
export function generateJwt(userId) {
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET is not defined");
	}

	return jwt.sign(
		{ sub: userId }, // subject = user ID
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES_IN || "4h", // configurable
		}
	);
}

/**
 * FR : Vérifie et décode un token JWT.
 * EN : Verifies and decodes a JWT token.
 */
export function verifyJwt(token) {
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET is not defined");
	}

	return jwt.verify(token, process.env.JWT_SECRET);
}
