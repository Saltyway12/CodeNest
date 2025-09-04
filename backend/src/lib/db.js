import mongoose from "mongoose";

// Fonction asynchrone pour se connecter à la base de données MongoDB
export const connectDB = async () => {
	try {
		// Connexion à MongoDB en utilisant l'URI stocké dans les variables d'environnement
		const connexionDB = await mongoose.connect(process.env.MONGO_URI);

		// Affichage dans la console de l'adresse de l'hôte MongoDB connecté
		console.log(
			`Connexion établie avec MongoDB : ${connexionDB.connection.host}`
		);
	} catch (error) {
		// En cas d'erreur lors de la connexion, on l'affiche dans la console
		console.log("Erreur de connexion à la base de données", error);

		// Quitte le processus Node avec un code 1 (indique un échec)
		process.exit(1);
	}
};
