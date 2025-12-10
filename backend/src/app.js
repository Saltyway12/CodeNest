/**
 * ---------------------------------------------------------
 *  Express Application Setup
 * ---------------------------------------------------------
 *  FR : Configuration principale de l'application Express.
 *       Charge les middlewares globaux, configure la sécurité,
 *       gère les cookies pour le JWT, et monte les routes
 *       de manière propre et modulaire.
 *
 *  EN : Main Express application setup. Loads global
 *       middlewares, configures security, handles JWT cookies,
 *       and mounts routes in a clean modular structure.
 * ---------------------------------------------------------
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { loadEnv } from "./config/env.js";

// Route modules
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import chatRoutes from "./routes/chat.routes.js";

// Load environment variables
loadEnv();

const app = express();

/* ---------------------------------------------------------
 *  Global Middlewares
 * ---------------------------------------------------------
 *
 *  FR : Middlewares globaux appliqués à toutes les requêtes.
 *       - CORS configuré avec credentials pour cookies JWT
 *       - Helmet pour sécuriser des headers HTTP
 *       - JSON parser pour body JSON
 *       - cookieParser pour lire les cookies httpOnly JWT
 *
 *  EN : Global middlewares applied to all requests.
 *       - CORS configured with credentials for JWT cookies
 *       - Helmet for secure HTTP headers
 *       - JSON parser for JSON bodies
 *       - cookieParser to read httpOnly JWT cookies
 * --------------------------------------------------------- */

app.use(
	cors({
		origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
		credentials: true,
	})
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

/* ---------------------------------------------------------
 *  Route Mounting
 * ---------------------------------------------------------
 *
 *  FR : Nous exposons chaque module de routes en double :
 *       1) Compatibilité CodeNest V1
 *       2) Version professionnelle sous /api/*
 *
 *       Cela garantit que l'application actuelle continue
 *       de fonctionner, tout en exposant une API moderne,
 *       lisible et maintenable.
 *
 *  EN : We expose each route module twice:
 *       1) CodeNest V1 compatibility
 *       2) Professional API under /api/*
 *
 *       This ensures backward compatibility while providing
 *       a clean and maintainable modern API namespace.
 * --------------------------------------------------------- */

/* ---------- AUTH ---------- */
app.use("/auth", authRoutes); // Legacy V1
app.use("/api/auth", authRoutes); // Professional API

/* ---------- USERS ---------- */
app.use("/users", userRoutes); // Legacy V1
app.use("/api/users", userRoutes); // Professional API

/* ---------- FRIENDS ---------- */
app.use("/users", friendRoutes); // Legacy V1
app.use("/api/friends", friendRoutes); // Professional API

/* ---------- CHAT ---------- */
app.use("/chat", chatRoutes); // Legacy V1
app.use("/api/chat", chatRoutes); // Professional API

/* ---------------------------------------------------------
 *  Export Express Application
 * ---------------------------------------------------------
 */

export default app;
