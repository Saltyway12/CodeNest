import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Contrôleur d'inscription utilisateur
 * Gère la création de compte avec validation des données
 * et génération automatique d'avatar
 */
export async function inscription(req, res) {
	const { email, password, fullName } = req.body;

	try {
		// Validation de la présence des champs obligatoires
		if (!email || !password || !fullName) {
			return res
				.status(400)
				.json({ message: "Veuillez remplir tous les champs" });
		}

		// Validation du mot de passe fort (6 caractères min, maj, min, chiffre, spécial)
		const strongPasswordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
		if (!strongPasswordRegex.test(password)) {
			return res.status(400).json({
				message:
					"Mot de passe invalide. Il doit contenir au moins 6 caractères dont 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.",
			});
		}

		// Validation du format email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				message: "Email invalide. Format attendu : exemple@domaine.com",
			});
		}

		// Vérification de l'unicité de l'email
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "Cet e-mail est déjà associé à un compte existant" });
		}

		// Génération d'un avatar aléatoire (index entre 1 et 100)
		const idx = Math.floor(Math.random() * 100) + 1;
		const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

		// Création de l'utilisateur (hashage du mot de passe géré par le modèle)
		const newUser = await User.create({
			email,
			fullName,
			password,
			profilePic: randomAvatar,
		});

		// Création du profil Stream Chat associé
		try {
			await upsertStreamUser({
				id: newUser._id.toString(),
				name: newUser.fullName,
				image: newUser.profilePic || "",
			});
			console.log(`Utilisateur Stream créé pour ${newUser.fullName}`);
		} catch (error) {
			console.log("Erreur de création d'utilisateur Stream", error);
		}

		// Génération du token JWT (valide 7 jours)
		const token = jwt.sign(
			{ userId: newUser._id },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "7d" }
		);

		// Configuration du cookie sécurisé pour le token
		res.cookie("jwt", token, {
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
			httpOnly: true, // Protection XSS
			sameSite: "strict", // Protection CSRF
			secure: process.env.NODE_ENV === "production", // HTTPS en production
		});

		// Réponse de succès avec les données utilisateur
		res.status(201).json({ success: true, user: newUser });
	} catch (error) {
		console.log("Erreur dans le contrôleur d'inscription", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur de connexion utilisateur
 * Authentifie l'utilisateur et génère un token de session
 */
export async function connexion(req, res) {
	try {
		const { email, password } = req.body;

		// Validation des champs requis
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "Veuillez remplir tous les champs" });
		}

		// Recherche de l'utilisateur par email
		const user = await User.findOne({ email });
		if (!user)
			return res
				.status(401)
				.json({ message: "E-mail ou mot de passe incorrect" });

		// Vérification du mot de passe
		const isPasswordCorrect = await user.matchPassword(password);
		if (!isPasswordCorrect)
			return res
				.status(401)
				.json({ message: "E-mail ou mot de passe incorrect" });

		// Génération du token JWT
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
			expiresIn: "7d",
		});

		// Configuration du cookie de session
		res.cookie("jwt", token, {
			maxAge: 7 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
		});

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Erreur dans le contrôleur de connexion", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur de déconnexion
 * Supprime le cookie de session JWT
 */
export async function deconnexion(req, res) {
	res.clearCookie("jwt");
	res.status(200).json({ success: true, message: "Déconnecté avec succès" });
}

/**
 * Contrôleur de configuration initiale du profil
 * Complète les informations utilisateur après inscription
 */
export async function onboard(req, res) {
	try {
		const userId = req.user._id;

		const { fullName, bio, nativeLanguage, learningLanguage, location } =
			req.body;

		// Validation des champs obligatoires pour l'onboarding
		if (
			!fullName ||
			!bio ||
			!nativeLanguage ||
			!learningLanguage ||
			!location
		) {
			return res.status(400).json({
				message: "Veuillez remplir tous les champs",
				missingFields: [
					!fullName && "fullName",
					!bio && "bio",
					!nativeLanguage && "nativeLanguage",
					!learningLanguage && "learningLanguage",
					!location && "location",
				].filter(Boolean),
			});
		}

		// Mise à jour du profil utilisateur avec marquage onboarding terminé
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{
				...req.body,
				isOnBoarded: true,
			},
			{ new: true }
		);

		if (!updatedUser)
			return res.status(404).json({ message: "Utilisateur introuvable" });

		// Mise à jour du profil Stream Chat associé
		try {
			await upsertStreamUser({
				id: updatedUser._id.toString(),
				name: updatedUser.fullName,
				image: updatedUser.profilePic || "",
			});
			console.log(
				`Le profil Stream de ${updatedUser.fullName} a été mis à jour avec succès`
			);
		} catch (streamError) {
			console.log(
				"Erreur de mise à jour du profil Stream pendant la configuration",
				streamError.message
			);
		}

		res.status(200).json({ succes: true, user: updatedUser });
	} catch (error) {
		console.log("Erreur de configuration profil", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}
