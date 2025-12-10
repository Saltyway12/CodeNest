/**
 * ---------------------------------------------------------
 *  FriendRequest Model (Final Professional Version)
 * ---------------------------------------------------------
 *  FR : Représente une demande d'ami entre deux utilisateurs.
 *       - Empêche les doublons via index unique
 *       - Supporte "pending", "accepted" et "rejected"
 *       - timestamps pour suivi temporel
 *
 *  EN : Represents a friend request between two users.
 *       - Prevents duplicates via unique index
 *       - Supports "pending", "accepted" and "rejected"
 *       - timestamps for chronological tracking
 * ---------------------------------------------------------
 */

import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
	{
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		status: {
			type: String,
			enum: ["pending", "accepted", "rejected"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

/* ---------------------------------------------------------
 *  Unique Request Constraint
 * ---------------------------------------------------------
 *  FR : Empêche l'envoi de plusieurs demandes identiques.
 *       Cela évite les doublons dans la base de données.
 *
 *  EN : Prevents multiple identical requests from being created.
 *       Ensures database integrity and avoids duplicates.
 * --------------------------------------------------------- */

friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
