import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Schéma MongoDB du modèle User décrivant les attributs persistés.
// Les timestamps createdAt/updatedAt sont activés via l'option timestamps.
const userSchema = new mongoose.Schema(
        {
                fullName: {
                        type: String,
                        required: true, // Nécessaire pour composer l'identité affichée côté client et Stream.
                },
                email: {
                        type: String,
                        required: true, // Doit être fourni pour différencier chaque compte utilisateur.
                        unique: true, // Empêche la duplication d'adresses électroniques.
                },
                password: {
                        type: String,
                        required: true, // Obligatoire afin d'autoriser l'authentification.
                        minlength: 6, // Rejette les mots de passe inférieurs à 6 caractères avant le hachage.
                },
                bio: {
                        type: String,
                        default: "", // Description libre affichée sur le profil utilisateur.
                },
                profilePic: {
                        type: String,
                        default: "", // URL absolue de l'avatar de l'utilisateur.
                },
                nativeLanguage: {
                        type: String,
                        default: "", // Langue maternelle renseignée lors de l'onboarding.
                },
                learningLanguage: {
                        type: String,
                        default: "", // Langue cible que l'utilisateur souhaite pratiquer.
                },
                location: {
                        type: String,
                        default: "", // Localisation déclarée par l'utilisateur.
                },
                isOnBoarded: {
                        type: Boolean,
                        default: false, // Indique si les étapes d'onboarding sont finalisées.
                },
                // Liste d'identifiants vers les contacts approuvés de l'utilisateur.
                friends: [
                        {
                                type: mongoose.Schema.Types.ObjectId,
                                ref: "User", // Permet de réaliser des populate vers le modèle User.
                        },
                ],
        },
        { timestamps: true } // Ajoute automatiquement les champs createdAt et updatedAt.
);

// Hook pre-save qui (re)hachera le mot de passe lorsqu'il est modifié.
userSchema.pre("save", async function (next) {
        // Court-circuite le hachage si le mot de passe reste inchangé.
        if (!this.isModified("password")) return next();

        try {
                // Produit un sel bcrypt avec un facteur de coût de 10.
                const salt = await bcrypt.genSalt(10);
                // Remplace le mot de passe en clair par son hash sécurisé.
                this.password = await bcrypt.hash(this.password, salt);
                next();
        } catch (error) {
                next(error); // Propage l'erreur au gestionnaire de middleware suivant.
        }
});

// Méthode d'instance utilisée pour comparer les identifiants fournis par l'utilisateur.
userSchema.methods.matchPassword = async function (enteredPassword) {
        const isPasswordCorrect = await bcrypt.compare(
                enteredPassword,
                this.password
        );
        return isPasswordCorrect;
};

// Compile le schéma en modèle Mongoose exploitable.
const User = mongoose.model("User", userSchema);

// Exporte le modèle pour les contrôleurs, services et middlewares.
export default User;
