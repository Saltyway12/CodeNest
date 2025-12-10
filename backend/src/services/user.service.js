/**
 * ---------------------------------------------------------
 *  User Service
 * ---------------------------------------------------------
 *  FR : Contient toute la logique métier liée aux utilisateurs :
 *       récupération du profil, liste des utilisateurs, mise à jour,
 *       recommandations, etc. Le contrôleur délègue 100 % du travail
 *       ici pour garder une architecture propre et testable.
 *
 *  EN : Contains all business logic related to user operations:
 *       profile retrieval, user listing, update, recommendations, etc.
 *       Controllers delegate all work here to keep a clean,
 *       testable architecture.
 * ---------------------------------------------------------
 */

import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

/* ---------------------------------------------------------
 *  Get the authenticated user
 * ------------------------------------------------------- */
export async function getCurrentUser(userId) {
	const user = await User.findById(userId).select("-password");

	if (!user) {
		throw new Error("User not found");
	}

	return user;
}

/* ---------------------------------------------------------
 *  Get all users (V1 behavior preserved)
 * ------------------------------------------------------- */
export async function getAllUsers() {
	return User.find().select("-password");
}

/* ---------------------------------------------------------
 *  Update user profile
 *  V1 route: /auth/configuration-profil
 * ------------------------------------------------------- */
export async function updateProfile(userId, updateData) {
	const user = await User.findByIdAndUpdate(userId, updateData, {
		new: true,
	}).select("-password");

	if (!user) {
		throw new Error("Unable to update profile");
	}

	return user;
}
