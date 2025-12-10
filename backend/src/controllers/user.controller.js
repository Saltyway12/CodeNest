/**
 * ---------------------------------------------------------
 *  User Controller
 * ---------------------------------------------------------
 *  FR : Gère uniquement la réception des requêtes HTTP et la
 *       réponse. Toute la logique métier est déléguée au
 *       UserService.
 *
 *  EN : Handles only HTTP request/response logic. All business
 *       logic is delegated to UserService.
 * ---------------------------------------------------------
 */

import {
	getCurrentUser,
	getAllUsers,
	updateProfile,
} from "../services/user.service.js";

/* ---------------------------------------------------------
 *  GET /users/moi  | GET /auth/moi
 * ------------------------------------------------------- */
export async function getMe(req, res) {
	try {
		const user = await getCurrentUser(req.userId);
		return res.status(200).json(user);
	} catch (err) {
		return res.status(404).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  GET /users
 * ------------------------------------------------------- */
export async function listUsers(req, res) {
	try {
		const users = await getAllUsers();
		return res.status(200).json(users);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
}

/* ---------------------------------------------------------
 *  PUT /auth/configuration-profil (Legacy V1)
 *  PUT /api/users/profile (Pro)
 * ------------------------------------------------------- */
export async function updateUserProfile(req, res) {
	try {
		const updated = await updateProfile(req.userId, req.body);
		return res.status(200).json(updated);
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
}
