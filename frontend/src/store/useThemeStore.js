import { create } from "zustand";

/**
 * Store Zustand pour la gestion des thèmes de l'application
 * Persiste la préférence de thème dans le localStorage
 * Fournit les fonctions pour récupérer et modifier le thème actuel
 */
export const useThemeStore = create((set) => ({
	// État initial : récupération du thème sauvegardé ou thème par défaut
	theme: localStorage.getItem("codeNest-theme") || "autumn",

	/**
	 * Fonction de mise à jour du thème
	 * Sauvegarde la nouvelle valeur dans localStorage et met à jour l'état
	 * @param {string} theme - Nouveau thème à appliquer
	 */
	setTheme: (theme) => {
		localStorage.setItem("codeNest-theme", theme);
		set({ theme });
	},
}));
