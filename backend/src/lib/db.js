import mongoose from "mongoose";

/**
 * Initialise la connexion MongoDB à l'aide de Mongoose en se basant sur la
 * variable d'environnement MONGO_URI fournie par l'infrastructure.
 */
export const connectDB = async () => {
        try {
                // Établit la connexion Mongoose à l'URI configurée.
                const connexionDB = await mongoose.connect(process.env.MONGO_URI);

                // Journalise l'hôte afin de confirmer la connexion effective.
                console.log(
                        `Connexion établie avec MongoDB : ${connexionDB.connection.host}`
                );
        } catch (error) {
                // Remonte l'erreur de connexion pour faciliter l'observabilité.
                console.log("Erreur de connexion à la base de données", error);

                // Termine le processus pour permettre à l'orchestrateur de redémarrer le service.
                process.exit(1);
        }
};
