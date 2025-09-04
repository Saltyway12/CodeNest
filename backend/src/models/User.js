import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Création du schéma utilisateur avec timestamps (createdAt et updatedAt)
// Le timestamp permet de savoir depuis quand un utilisateur est membre
const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String, // Nom complet de l'utilisateur
			required: true, // Champ obligatoire
		},
		email: {
			type: String, // Adresse email
			required: true, // Champ obligatoire
			unique: true, // L'email doit être unique dans la base de données
		},
		password: {
			type: String, // Mot de passe
			required: true, // Champ obligatoire
			minlength: 6, // Longueur minimale de 6 caractères
		},
		bio: {
			type: String, // Biographie ou description de l'utilisateur
			default: "", // Par défaut, champ vide
		},
		profilePic: {
			type: String, // URL de la photo de profil
			default: "", // Par défaut, champ vide
		},
		nativeLanguage: {
			type: String, // Langue maternelle
			default: "", // Par défaut, champ vide
		},
		learningLanguage: {
			type: String, // Langue en apprentissage
			default: "", // Par défaut, champ vide
		},
		location: {
			type: String, // Localisation de l'utilisateur
			default: "", // Par défaut, champ vide
		},
		isOnBoarded: {
			type: Boolean, // Indique si l'utilisateur a terminé l'onboarding
			default: false, // Par défaut, false
		},

		// Liste d'amis (références à d'autres utilisateurs)
		friends: [
			{
				type: mongoose.Schema.Types.ObjectId, // Stocke l'ID MongoDB d'un autre utilisateur
				ref: "User", // Référence au modèle User pour population future
			},
		],
	},
	{ timestamps: true } // Création automatique des champs createdAt et updatedAt
);

// Hook Mongoose exécuté avant l'enregistrement ("save")
// Permet de hacher le mot de passe avant de le stocker en base
userSchema.pre("save", async function (next) {
	// Si le mot de passe n'a pas été modifié, on passe au suivant
	if (!this.isModified("password")) return next();
	try {
		const salt = await bcrypt.genSalt(10); // Génération d'un sel pour le hash
		this.password = await bcrypt.hash(this.password, salt); // Hachage du mot de passe
		next(); // Passe à l'enregistrement
	} catch (error) {
		next(error); // En cas d'erreur, passe l'erreur au middleware suivant
	}
});

userSchema.methods.matchPassword = async function (enteredPassword) {
	const isPasswordCorrect = await bcrypt.compare(
		enteredPassword,
		this.password
	);
	return isPasswordCorrect;
};

// Création du modèle Mongoose basé sur le schéma
const User = mongoose.model("User", userSchema);

export default User; // Export du modèle pour l'utiliser ailleurs dans l'application
