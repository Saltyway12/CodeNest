import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Définition du schéma MongoDB pour le modèle User
// Inclut les timestamps automatiques (createdAt, updatedAt)
const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true, // Nom complet obligatoire
		},
		email: {
			type: String,
			required: true, // Email obligatoire
			unique: true, // Contrainte d'unicité sur l'email
		},
		password: {
			type: String,
			required: true, // Mot de passe obligatoire
			minlength: 6, // Longueur minimale de 6 caractères
		},
		bio: {
			type: String,
			default: "", // Biographie ou description personnelle
		},
		profilePic: {
			type: String,
			default: "", // URL de la photo de profil
		},
		nativeLanguage: {
			type: String,
			default: "", // Langue maternelle de l'utilisateur
		},
		learningLanguage: {
			type: String,
			default: "", // Langage que l'utilisateur souhaite apprendre
		},
		location: {
			type: String,
			default: "", // Localisation géographique
		},
		isOnBoarded: {
			type: Boolean,
			default: false, // Statut de completion de l'onboarding initial
		},
		// Tableau des références vers les amis de l'utilisateur
		friends: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User", // Référence au modèle User pour les requêtes populate
			},
		],
	},
	{ timestamps: true } // Ajout automatique des champs createdAt et updatedAt
);

// Middleware pre-save pour le hachage automatique du mot de passe
// S'exécute avant chaque opération de sauvegarde
userSchema.pre("save", async function (next) {
	// Vérifie si le champ password a été modifié
	if (!this.isModified("password")) return next();

	try {
		// Génération d'un sel cryptographique avec coût 10
		const salt = await bcrypt.genSalt(10);
		// Hachage du mot de passe avec le sel généré
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error); // Propagation de l'erreur vers le middleware suivant
	}
});

// Méthode d'instance pour la vérification du mot de passe
// Compare un mot de passe en clair avec le hash stocké
userSchema.methods.matchPassword = async function (enteredPassword) {
	const isPasswordCorrect = await bcrypt.compare(
		enteredPassword,
		this.password
	);
	return isPasswordCorrect;
};

// Création du modèle Mongoose basé sur le schéma défini
const User = mongoose.model("User", userSchema);

// Export du modèle pour utilisation dans les contrôleurs et services
export default User;
