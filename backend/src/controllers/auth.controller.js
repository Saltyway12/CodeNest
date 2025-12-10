/**
 * ---------------------------------------------------------
 *  Auth Controller (Final Professional Version)
 * ---------------------------------------------------------
 *  FR : Gère les requêtes HTTP d'authentification.
 *       - Inscription
 *       - Connexion
 *       - Récupération utilisateur
 *       - Déconnexion
 *
 *  EN : Handles HTTP authentication requests.
 *       - Signup
 *       - Login
 *       - Me
 *       - Logout
 * ---------------------------------------------------------
 */

import {
	registerUser,
	loginUser,
	getAuthenticatedUser,
} from "../services/auth.service.js";

import { generateJwt } from "../utils/jwt.js";

/* ---------------------------------------------------------
 *  POST /auth/inscription  |  POST /api/auth/signup
 * ---------------------------------------------------------
 *  FR : Inscrit un nouvel utilisateur, génère un JWT, définit
 *       un cookie httpOnly sécurisé, renvoie les informations.
 *
 *  EN : Registers a new user, generates a JWT, sets a secure
 *       httpOnly cookie, returns user information.
 * --------------------------------------------------------- */

export async function signup(req, res) {
	try {
		const { fullName, email, password } = req.body;

		const user = await registerUser({ fullName, email, password });
		const token = generateJwt(user._id.toString());

		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 1000 * 60 * 60 * 4, // 4h
		});

		return res.status(201).json({
			message: "User created",
			user: {
				_id: user._id,
				fullName: user.fullName,
				email: user.email,
			},
		});
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  POST /auth/connexion | POST /api/auth/login
 * ---------------------------------------------------------
 */

export async function login(req, res) {
	try {
		const { email, password } = req.body;

		const user = await loginUser(email, password);
		const token = generateJwt(user._id.toString());

		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 1000 * 60 * 60 * 4,
		});

		return res.status(200).json({
			message: "Login successful",
			user: {
				_id: user._id,
				fullName: user.fullName,
				email: user.email,
			},
		});
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  GET /auth/moi | GET /api/auth/me
 * ---------------------------------------------------------
 */

export async function me(req, res) {
	try {
		const user = await getAuthenticatedUser(req.userId);

		return res.status(200).json({
			user,
		});
	} catch (err) {
		return res.status(404).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  POST /auth/deconnexion | POST /api/auth/logout
 * ---------------------------------------------------------
 */

export async function logout(req, res) {
	res.clearCookie("jwt", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	return res.status(200).json({ message: "Logged out" });
}
