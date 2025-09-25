import axios from "axios";
import { LANGUAGE_VERSIONS } from "../constants/constants.js";

// Configuration de l'instance Axios pour l'API Piston (exécution de code)
const API = axios.create({
	baseURL: "https://emkc.org/api/v2/piston",
});

/**
 * Service d'exécution de code distant
 * Utilise l'API Piston pour compiler et exécuter du code dans différents langages
 * @param {string} language - Langage de programmation (ex: "javascript", "python")
 * @param {string} sourceCode - Code source à exécuter
 * @returns {Promise<Object>} - Résultat de l'exécution (sortie, erreurs, statut)
 */
export const executeCode = async (language, sourceCode) => {
	const response = await API.post("/execute", {
		language: language,
		version: LANGUAGE_VERSIONS[language], // Version spécifique du langage
		files: [
			{
				content: sourceCode, // Contenu du fichier à exécuter
			},
		],
	});
	return response.data;
};
