import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Gère l'inscription d'un utilisateur.
 * Valide la charge utile, persiste le document MongoDB et initialise le compte
 * Stream Chat avant de retourner un cookie de session JWT.
 */
export async function inscription(req, res) {
        const { email, password, fullName } = req.body;

        try {
                // Vérifie que les champs requis sont présents avant de poursuivre.
                if (!email || !password || !fullName) {
                        return res
                                .status(400)
                                .json({ message: "Veuillez remplir tous les champs" });
                }

                // Applique les exigences de complexité définies par strongPasswordRegex.
                const strongPasswordRegex =
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
                if (!strongPasswordRegex.test(password)) {
                        return res.status(400).json({
                                message:
					"Mot de passe invalide. Il doit contenir au moins 6 caractères dont 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.",
			});
		}

                // S'assure que l'adresse e-mail respecte le format attendu.
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                if (!emailRegex.test(email)) {
                        return res.status(400).json({
                                message: "Email invalide. Format attendu : exemple@domaine.com",
                        });
                }

                // Empêche la création d'un doublon si l'adresse e-mail est déjà utilisée.
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                        return res
                                .status(400)
                                .json({ message: "Cet e-mail est déjà associé à un compte existant" });
                }

                // Génère un index d'avatar aléatoire compris entre 1 et 100.
                const idx = Math.floor(Math.random() * 100) + 1;
                const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

                // Persiste l'utilisateur ; le hachage du mot de passe est géré par le modèle.
                const newUser = await User.create({
                        email,
                        fullName,
                        password,
                        profilePic: randomAvatar,
                });

                // Synchronise le compte avec Stream Chat pour unifier l'identité temps réel.
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

                // Signe un token de session de 7 jours qui sera exposé via un cookie.
                const token = jwt.sign(
                        { userId: newUser._id },
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "7d" }
                );

                // Attache le JWT à un cookie configuré contre les attaques XSS et CSRF.
                res.cookie("jwt", token, {
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
                        httpOnly: true, // Protection XSS
			sameSite: "strict", // Protection CSRF
			secure: process.env.NODE_ENV === "production", // HTTPS en production
                });

                // Retourne le document utilisateur nouvellement créé.
                res.status(201).json({ success: true, user: newUser });
        } catch (error) {
                console.log("Erreur dans le contrôleur d'inscription", error);
                res.status(500).json({ message: "Erreur interne du serveur" });
        }
}

/**
 * Traite la connexion d'un utilisateur en validant les identifiants et en émettant
 * un cookie de session JWT.
 */
export async function connexion(req, res) {
        try {
                const { email, password } = req.body;

                // Vérifie que les identifiants essentiels sont fournis.
                if (!email || !password) {
                        return res
                                .status(400)
                                .json({ message: "Veuillez remplir tous les champs" });
                }

                // Récupère le document utilisateur correspondant à l'adresse e-mail.
                const user = await User.findOne({ email });
                if (!user)
                        return res
                                .status(401)
                                .json({ message: "E-mail ou mot de passe incorrect" });

                // Compare le mot de passe en clair au hash stocké.
                const isPasswordCorrect = await user.matchPassword(password);
                if (!isPasswordCorrect)
                        return res
                                .status(401)
                                .json({ message: "E-mail ou mot de passe incorrect" });

                // Génère un token de session pour l'utilisateur authentifié.
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
                        expiresIn: "7d",
                });

                // Stocke le JWT dans un cookie sécurisé.
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
 * Supprime le cookie JWT afin d'invalider la session en cours.
 */
export async function deconnexion(req, res) {
        res.clearCookie("jwt");
        res.status(200).json({ success: true, message: "Déconnecté avec succès" });
}

/**
 * Finalise le profil utilisateur après l'inscription en validant les champs
 * d'onboarding puis en synchronisant la mise à jour avec Stream Chat.
 */
export async function onboard(req, res) {
        try {
                const userId = req.user._id;

                const { fullName, bio, nativeLanguage, learningLanguage, location } =
                        req.body;

                // Vérifie que chaque attribut d'onboarding requis est fourni.
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

                // Met à jour le document utilisateur et marque l'onboarding comme terminé.
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

                // Aligne le profil Stream Chat avec les nouvelles informations.
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
