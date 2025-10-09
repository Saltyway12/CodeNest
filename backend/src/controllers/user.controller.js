import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { deleteStreamUser } from "../lib/stream.js";

/**
 * Contrôleur de recommandation d'utilisateurs
 * Retourne une liste d'utilisateurs suggérés pour de nouvelles connexions
 * Exclut l'utilisateur actuel, ses amis existants et les profils non configurés
 */
export async function getRecommendedUsers(req, res) {
	try {
		const currentUserId = req.user.id;
		const currentUser = req.user;

		// Recherche d'utilisateurs recommandés avec filtres
		const recommendedUsers = await User.find({
			$and: [
				{ _id: { $ne: currentUserId } }, // Exclure soi-même
				{ _id: { $nin: currentUser.friends } }, // Exclure les amis existants
				{ isOnBoarded: true }, // Uniquement les profils configurés
			],
		});

		res.status(200).json(recommendedUsers);
	} catch (error) {
		console.error("Erreur dans getRecommendedUsers :", error.message);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur de récupération de la liste d'amis
 * Retourne les informations des amis de l'utilisateur connecté
 * avec population des données de profil
 */
export async function getMyFriends(req, res) {
	try {
		const user = await User.findById(req.user.id)
			.select("friends") // Sélection du champ friends uniquement
			.populate(
				"friends", // Population des objets User complets
				"fullName profilePic nativeLanguage learningLanguage" // Champs spécifiques
			);

		res.status(200).json(user.friends);
	} catch (error) {
		console.error("Erreur dans getMyFriends :", error.message);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur d'envoi de demande d'ami
 * Gère la création d'une nouvelle demande d'amitié avec validations
 * Vérifie l'existence du destinataire et l'absence de relations existantes
 */
export async function sendFriendRequest(req, res) {
	try {
		const myId = req.user.id;
		const { id: recipientId } = req.params;

		// Validation : empêcher l'auto-demande
		if (myId === recipientId) {
			return res
				.status(400)
				.json({ message: "Vous ne pouvez pas vous envoyer une demande d'ami" });
		}

		// Vérification de l'existence du destinataire
		const recipient = await User.findById(recipientId);
		if (!recipient) {
			return res
				.status(404)
				.json({ message: "Utilisateur destinataire introuvable" });
		}

		// Vérification : éviter les demandes entre amis existants
		if (recipient.friends.includes(myId)) {
			return res
				.status(400)
				.json({ message: "Vous êtes déjà amis avec cet utilisateur" });
		}

		// Vérification de l'absence de demande existante (bidirectionnelle)
		const existingRequest = await FriendRequest.findOne({
			$or: [
				{ sender: myId, recipient: recipientId },
				{ sender: recipientId, recipient: myId },
			],
		});

		if (existingRequest) {
			return res.status(400).json({
				message: "Une demande d'ami existe déjà entre vous et cet utilisateur",
			});
		}

		// Création de la nouvelle demande d'ami
		const friendRequest = await FriendRequest.create({
			sender: myId,
			recipient: recipientId,
		});

		res.status(201).json(friendRequest);
	} catch (error) {
		console.error("Erreur dans sendFriendRequest :", error.message);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur d'acceptation de demande d'ami
 * Traite l'acceptation d'une demande et met à jour les listes d'amis
 * Vérifie les autorisations et met à jour les relations bidirectionnelles
 */
export async function acceptFriendRequest(req, res) {
	try {
		const { id: requestId } = req.params;

		// Vérification de l'existence de la demande
		const friendRequest = await FriendRequest.findById(requestId);
		if (!friendRequest) {
			return res.status(404).json({ message: "Demande d'ami introuvable" });
		}

		// Vérification des droits d'acceptation (destinataire uniquement)
		if (friendRequest.recipient.toString() !== req.user.id) {
			return res
				.status(403)
				.json({ message: "Vous n'êtes pas autorisé à accepter cette demande" });
		}

		// Mise à jour du statut de la demande
		friendRequest.status = "accepted";
		await friendRequest.save();

		// Ajout bidirectionnel dans les listes d'amis (évite les doublons)
		await User.findByIdAndUpdate(friendRequest.sender, {
			$addToSet: { friends: friendRequest.recipient },
		});

		await User.findByIdAndUpdate(friendRequest.recipient, {
			$addToSet: { friends: friendRequest.sender },
		});

		res.status(200).json({ message: "Demande d'ami acceptée avec succès" });
	} catch (error) {
		console.log("Erreur dans acceptFriendRequest :", error.message);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur de récupération des demandes d'ami
 * Retourne les demandes reçues (en attente) et envoyées (acceptées)
 * avec population des informations des utilisateurs concernés
 */
export async function getFriendRequests(req, res) {
	try {
		// Demandes reçues en attente de traitement
		const incomingReqs = await FriendRequest.find({
			recipient: req.user.id,
			status: "pending",
		}).populate(
			"sender",
			"fullName profilePic nativeLanguage learningLanguage"
		);

		// Demandes envoyées et acceptées
		const acceptedReqs = await FriendRequest.find({
			sender: req.user.id,
			status: "accepted",
		}).populate("recipient", "fullName profilePic");

		res.status(200).json({ incomingReqs, acceptedReqs });
	} catch (error) {
		console.log("Erreur dans getFriendRequests :", error.message);
		res.status(500).json({ message: "Erreur interne du serveur" });
	}
}

/**
 * Contrôleur de récupération des demandes envoyées
 * Retourne les demandes d'ami envoyées par l'utilisateur qui sont encore en attente
 * avec informations des destinataires
 */
export async function getOutgoingFriendReqs(req, res) {
        try {
                const outgoingRequests = await FriendRequest.find({
                        sender: req.user.id,
                        status: "pending",
                }).populate(
                        "recipient",
                        "fullName profilePic nativeLanguage learningLanguage"
                );

                res.status(200).json(outgoingRequests);
        } catch (error) {
                console.log("Erreur dans getOutgoingFriendReqs :", error.message);
                res.status(500).json({ message: "Erreur interne du serveur" });
        }
}

/**
 * Supprime le compte de l'utilisateur connecté ainsi que ses dépendances.
 * Nettoie les demandes d'amis associées, retire le profil des listes d'amis et
 * révoque le compte côté Stream Chat avant de révoquer la session.
 */
export async function deleteCurrentUser(req, res) {
        try {
                const userId = req.user.id;

                // Supprimer toutes les demandes d'amis liées à l'utilisateur.
                await FriendRequest.deleteMany({
                        $or: [{ sender: userId }, { recipient: userId }],
                });

                // Retirer l'utilisateur des listes d'amis existantes.
                await User.updateMany(
                        { friends: userId },
                        { $pull: { friends: userId } }
                );

                // Supprimer le document utilisateur principal.
                const deletedUser = await User.findByIdAndDelete(userId);

                if (!deletedUser) {
                        return res.status(404).json({ message: "Utilisateur introuvable" });
                }

                // Tentative de suppression côté Stream Chat (non bloquante).
                await deleteStreamUser(userId);

                // Invalidation de la session côté client.
                res.clearCookie("jwt");

                res.status(200).json({ message: "Compte supprimé avec succès" });
        } catch (error) {
                console.error("Erreur dans deleteCurrentUser :", error.message);
                res.status(500).json({ message: "Erreur interne du serveur" });
        }
}
