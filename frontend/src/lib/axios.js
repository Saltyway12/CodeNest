import axios from "axios";

// Résout dynamiquement l'URL d'API selon le mode Vite (dev ou build)
const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

/**
 * Instance Axios configurée pour les appels API de l'application
 * Gère automatiquement les cookies de session et l'URL de base
 * Adapte l'URL selon l'environnement (développement/production)
 */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
