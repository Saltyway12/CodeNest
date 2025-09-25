import mongoose from "mongoose";

// Définition du schéma MongoDB pour le modèle FriendRequest
// Gère les demandes d'amitié entre utilisateurs
const friendRequestSchema = new mongoose.Schema(
	{
		// Référence vers l'utilisateur expéditeur de la demande
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Référence au modèle User pour les requêtes populate
			required: true, // Expéditeur obligatoire
		},
		// Référence vers l'utilisateur destinataire de la demande
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Référence au modèle User pour les requêtes populate
			required: true, // Destinataire obligatoire
		},
		// Statut actuel de la demande d'amitié
		status: {
			type: String,
			enum: ["pending", "accepted"], // Valeurs autorisées uniquement
			default: "pending", // Statut initial par défaut
		},
	},
	{
		timestamps: true, // Ajout automatique des champs createdAt et updatedAt
	}
);

// Création du modèle Mongoose pour les opérations CRUD sur les demandes d'amitié
const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

// Export du modèle pour utilisation dans les contrôleurs et services
export default FriendRequest;
