/**
 * ---------------------------------------------------------
 *  Friend Service
 * ---------------------------------------------------------
 *  FR : Logique métier liée aux relations d'amitié :
 *       - récupération de la liste d'amis
 *       - demandes entrantes / sortantes
 *       - envoi / acceptation de demandes
 *
 *  EN : Business logic for friendship relationships:
 *       - retrieving friend list
 *       - incoming / outgoing requests
 *       - sending / accepting requests
 * ---------------------------------------------------------
 */

import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

/* ---------------------------------------------------------
 *  getFriends
 * ---------------------------------------------------------
 *  FR : Retourne la liste d'amis d'un utilisateur, avec
 *       population de quelques champs de profil.
 *
 *  EN : Returns the friend list of a user, with a limited
 *       set of profile fields populated.
 * --------------------------------------------------------- */
export async function getFriends(userId) {
	// Récupère uniquement le champ "friends" et peuple les profils liés
	const user = await User.findById(userId)
		.select("friends")
		.populate("friends", "fullName profilePic nativeLanguage learningLanguage");

	if (!user) {
		throw new Error("User not found");
	}

	return user.friends;
}

/* ---------------------------------------------------------
 *  getIncomingRequests
 * ---------------------------------------------------------
 *  FR : Liste les demandes d'amis reçues (status = pending),
 *       avec les infos du sender peuplées.
 *
 *  EN : Lists incoming friend requests (status = pending),
 *       with sender information populated.
 * --------------------------------------------------------- */
export async function getIncomingRequests(userId) {
	return FriendRequest.find({
		recipient: userId,
		status: "pending",
	}).populate("sender", "fullName profilePic nativeLanguage learningLanguage");
}

/* ---------------------------------------------------------
 *  getOutgoingRequests
 * ---------------------------------------------------------
 *  FR : Liste les demandes d'amis envoyées (status = pending),
 *       avec les infos du destinataire peuplées.
 *
 *  EN : Lists outgoing friend requests (status = pending),
 *       with recipient information populated.
 * --------------------------------------------------------- */
export async function getOutgoingRequests(userId) {
	return FriendRequest.find({
		sender: userId,
		status: "pending",
	}).populate(
		"recipient",
		"fullName profilePic nativeLanguage learningLanguage"
	);
}

/* ---------------------------------------------------------
 *  getAcceptedRequests (optionnel mais utile)
 * ---------------------------------------------------------
 *  FR : Liste toutes les demandes déjà acceptées où l'utilisateur
 *       est soit sender soit recipient.
 *
 *  EN : Lists all accepted requests where the user is either
 *       the sender or the recipient.
 * --------------------------------------------------------- */
export async function getAcceptedRequests(userId) {
	return FriendRequest.find({
		status: "accepted",
		$or: [{ sender: userId }, { recipient: userId }],
	}).populate(
		["sender", "recipient"],
		"fullName profilePic nativeLanguage learningLanguage"
	);
}

/* ---------------------------------------------------------
 *  sendFriendRequest
 * ---------------------------------------------------------
 *  FR : Envoie une demande d'ami après avoir vérifié :
 *       - qu'on ne s'envoie pas une demande à soi-même
 *       - que le destinataire existe
 *       - qu'on n'est pas déjà amis
 *       - qu'aucune demande (dans un sens ou l'autre) n'existe déjà
 *
 *  EN : Sends a friend request after validating that:
 *       - user is not sending a request to himself
 *       - recipient exists
 *       - they are not already friends
 *       - no existing request exists in either direction
 * --------------------------------------------------------- */
export async function sendFriendRequest(senderId, recipientId) {
	// Auto-demande interdite
	if (senderId === recipientId) {
		throw new Error("You cannot send a friend request to yourself");
	}

	// Vérifie que le destinataire existe
	const recipient = await User.findById(recipientId);
	if (!recipient) {
		throw new Error("Recipient user not found");
	}

	// Vérifie qu'ils ne sont pas déjà amis
	if (recipient.friends.map(String).includes(String(senderId))) {
		throw new Error("You are already friends with this user");
	}

	// Vérifie l'absence de demande existante dans les deux sens
	const existingRequest = await FriendRequest.findOne({
		$or: [
			{ sender: senderId, recipient: recipientId },
			{ sender: recipientId, recipient: senderId },
		],
	});

	if (existingRequest) {
		throw new Error("A friend request already exists between these two users");
	}

	// Création de la demande
	const friendRequest = await FriendRequest.create({
		sender: senderId,
		recipient: recipientId,
		status: "pending",
	});

	return friendRequest;
}

/* ---------------------------------------------------------
 *  acceptFriendRequest
 * ---------------------------------------------------------
 *  FR : Accepte une demande d'ami :
 *       - vérifie l'existence de la demande
 *       - vérifie que l'utilisateur courant est bien le destinataire
 *       - met le statut à "accepted"
 *       - ajoute chaque utilisateur dans la liste d'amis de l'autre
 *
 *  EN : Accepts a friend request:
 *       - ensures the request exists
 *       - ensures the current user is the recipient
 *       - sets status to "accepted"
 *       - adds each user to the other's friend list
 * --------------------------------------------------------- */
export async function acceptFriendRequest(requestId, currentUserId) {
	const friendRequest = await FriendRequest.findById(requestId);

	if (!friendRequest) {
		throw new Error("Friend request not found");
	}

	// Vérifie que seul le destinataire peut accepter
	if (friendRequest.recipient.toString() !== String(currentUserId)) {
		throw new Error("You are not allowed to accept this request");
	}

	// Si déjà acceptée, on ne duplique pas les relations
	if (friendRequest.status === "accepted") {
		return friendRequest;
	}

	friendRequest.status = "accepted";
	await friendRequest.save();

	// Ajoute chaque utilisateur dans la liste d'amis de l'autre
	await User.findByIdAndUpdate(friendRequest.sender, {
		$addToSet: { friends: friendRequest.recipient },
	});

	await User.findByIdAndUpdate(friendRequest.recipient, {
		$addToSet: { friends: friendRequest.sender },
	});

	return friendRequest;
}
