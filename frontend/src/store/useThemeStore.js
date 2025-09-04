import { create } from "zustand";

export const useThemeStore = create((set) => ({
	theme: localStorage.getItem("codeNest-theme") || "autumn",
	setTheme: (theme) => {
		localStorage.setItem("codeNest-theme", theme);
		set({ theme });
	},
}));
