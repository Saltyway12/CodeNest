import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function inscription(req, res) {
	const { email, password, fullName } = req.body; // Récupération des données envoyées par le client

	try {
		// Vérifie si tous les champs obligatoires sont présents
		if (!email || !password || !fullName) {
			return res
				.status(400)
				.json({ message: "Veuillez remplir tous les champs" });
		}

		// Définition de la regex pour un mot de passe fort
		// Doit contenir : au moins 6 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial
		const strongPasswordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
		if (!strongPasswordRegex.test(password)) {
			return res.status(400).json({
				message:
					"Mot de passe invalide. Il doit contenir au moins 6 caractères dont 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.",
			});
		}

		// Définition de la regex pour valider le format d'un email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				message: "Email invalide. Format attendu : exemple@domaine.com",
			});
		}

		// Vérifie si un utilisateur avec le même email existe déjà en base de données
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "Cet e-mail est déja associé à un compte existant" });
		}

		// Génération d'un index aléatoire pour l'avatar (nombre entre 1 et 100)
		const idx = Math.floor(Math.random() * 100) + 1;

		const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

		// Création d'un nouvel utilisateur dans la base de données
		// Le hashage du mot de passe est géré dans le modèle User
		const newUser = await User.create({
			email,
			fullName,
			password,
			profilePic: randomAvatar,
		});

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

		// Génération d'un token JWT contenant l'ID utilisateur
		// Le token est valide pendant 7 jours
		const token = jwt.sign(
			{ userId: newUser._id },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "7d" }
		);

		// Stockage du token JWT dans un cookie sécurisé
		res.cookie("jwt", token, {
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
			httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
			sameSite: "strict", // Protection CSRF
			secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
		});

		// Réponse HTTP avec statut 201 (créé) et les infos utilisateur
		res.status(201).json({ success: true, user: newUser });
	} catch (error) {
		// Gestion des erreurs serveur
		console.log("Erreur dans le contrôleur d'inscription", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

export async function connexion(req, res) {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "Veuillez remplir tous les champs" });
		}
		const user = await User.findOne({ email });
		if (!user)
			return res
				.status(401)
				.json({ message: "E-mail ou mot de passe incorrect" });

		const isPasswordCorrect = await user.matchPassword(password);
		if (!isPasswordCorrect)
			return res
				.status(401)
				.json({ message: "E-mail ou mot de passe incorrect" });

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
			expiresIn: "7d",
		});

		// Stockage du token JWT dans un cookie sécurisé
		res.cookie("jwt", token, {
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
			httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
			sameSite: "strict", // Protection CSRF
			secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
		});

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Erreur dans le contrôleur de connexion", error);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

export async function deconnexion(req, res) {
	res.clearCookie("jwt");
	res.status(200).json({ success: true, message: "Déconnecté avec succès" });
}

export async function onboard(req, res) {
	try {
		const userId = req.user._id;

		const { fullName, bio, nativeLanguage, learningLanguage, location } =
			req.body;

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

		try {
			await upsertStreamUser({
				id: updatedUser._id.toString(),
				name: updatedUser.fullName,
				image: updatedUser.profilePic || "",
			});
			console.log(
				`Le profil Stream de ${updatedUser.fullName} à été mis à jour avec succès`
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
