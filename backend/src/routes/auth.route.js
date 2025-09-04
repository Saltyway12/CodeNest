import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	connexion,
	deconnexion,
	inscription,
	onboard,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/inscription", inscription);

router.post("/connexion", connexion);

router.post("/deconnexion", deconnexion);

router.post("/configuration-profil", protectRoute, onboard);

// check si l'utilisateur est connecté
router.get("/moi", protectRoute, (req, res) => {
	res.status(200).json({ success: true, user: req.user });
});

export default router;
