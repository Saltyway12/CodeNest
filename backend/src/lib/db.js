import mongoose from "mongoose";

/**
 * Configuration et connexion à la base de données MongoDB
 * Utilise la variable d'environnement MONGO_URI pour la chaîne de connexion
 */
export const connectDB = async () => {
	try {
		// Établissement de la connexion MongoDB via Mongoose
		const connexionDB = await mongoose.connect(process.env.MONGO_URI);

		// Affichage de confirmation avec l'hôte de la base connectée
		console.log(
			`Connexion établie avec MongoDB : ${connexionDB.connection.host}`
		);
	} catch (error) {
		// Gestion des erreurs de connexion
		console.log("Erreur de connexion à la base de données", error);

		// Arrêt du processus en cas d'échec de connexion
		process.exit(1);
	}
};
