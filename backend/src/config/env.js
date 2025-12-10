/**
 * ---------------------------------------------------------
 *  Environment Configuration Loader
 * ---------------------------------------------------------
 *  FR : Charge les variables d'environnement depuis le
 *       fichier .env et applique des vérifications minimales.
 *
 *  EN : Loads environment variables from the .env file and
 *       performs minimal safety checks.
 * ---------------------------------------------------------
 */

import dotenv from "dotenv";

/**
 * FR : Charge et initialise les variables d'environnement.
 * EN : Loads and initializes environment variables.
 */
export function loadEnv() {
	const result = dotenv.config();

	// -----------------------------------------------------
	// Handle missing or unreadable .env file
	// -----------------------------------------------------
	if (result.error) {
		console.warn("No .env file found or it could not be loaded.");
	}

	// -----------------------------------------------------
	// Minimal required variables (optional for V1)
	// -----------------------------------------------------
	const required = ["PORT"];

	required.forEach((key) => {
		if (!process.env[key]) {
			console.warn(`Missing environment variable: ${key}`);
		}
	});
}
