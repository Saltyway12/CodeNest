/**
 * ---------------------------------------------------------
 *  Auth Service (Final Professional Version)
 * ---------------------------------------------------------
 *  FR : Gère la logique métier de l'authentification.
 *       - Création d'utilisateur
 *       - Validation du mot de passe
 *       - Connexion
 *       - Récupération de l'utilisateur authentifié
 *
 *  EN : Handles authentication business logic.
 *       - User creation
 *       - Password validation
 *       - Login
 *       - Fetch authenticated user
 * ---------------------------------------------------------
 */

import User from "../models/User.js";
import { validatePassword } from "../validators/auth.validator.js";

/* ---------------------------------------------------------
 *  registerUser
 * ---------------------------------------------------------
 *  FR : Crée un nouvel utilisateur après validation stricte.
 *       - Vérifie les champs requis
 *       - Vérifie la force du mot de passe
 *       - Vérifie l'unicité de l'email
 *       - Hash du mot de passe via le hook mongoose "pre('save')"
 *
 *  EN : Creates a new user after strict validation.
 *       - Validates required fields
 *       - Validates password strength
 *       - Checks email uniqueness
 *       - Password hashing handled by mongoose pre-save hook
 * --------------------------------------------------------- */

export async function registerUser({ fullName, email, password }) {
	if (!fullName || !email || !password) {
		throw new Error("Missing required fields");
	}

	// Password policy (strong password)
	if (!validatePassword(password)) {
		throw new Error(
			"Weak password: must be 8+ chars with uppercase, lowercase, digit, and symbol."
		);
	}

	// Uniqueness check
	const exists = await User.findOne({ email });
	if (exists) {
		throw new Error("Email already in use");
	}

	// User creation (password hash done by model hook)
	const user = new User({
		fullName,
		email,
		password,
	});

	await user.save();
	return user;
}

/* ---------------------------------------------------------
 *  loginUser
 * ---------------------------------------------------------
 *  FR : Vérifie que l'email existe et que le mot de passe
 *       correspond au hash enregistré.
 *
 *  EN : Validates email existence and password correctness.
 * --------------------------------------------------------- */

export async function loginUser(email, password) {
	if (!email || !password) {
		throw new Error("Email and password are required");
	}

	const user = await User.findOne({ email });
	if (!user) {
		throw new Error("Invalid credentials");
	}

	const validPassword = await user.matchPassword(password);
	if (!validPassword) {
		throw new Error("Invalid credentials");
	}

	return user;
}

/* ---------------------------------------------------------
 *  getAuthenticatedUser
 * ---------------------------------------------------------
 *  FR : Récupère l'utilisateur via son ID fourni par le JWT.
 *
 *  EN : Fetches the authenticated user using the JWT payload.
 * --------------------------------------------------------- */

export async function getAuthenticatedUser(userId) {
	const user = await User.findById(userId).select("-password");

	if (!user) {
		throw new Error("User not found");
	}

	return user;
}
