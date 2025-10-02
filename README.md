**CodeNest** est une application web collaborative hébergée sur Render, dédiée au chat, aux appels vidéo et à l’édition de code en temps réel entre utilisateurs lors d’un appel.

À la manière d’un réseau social, CodeNest permet de découvrir des utilisateurs qui apprennent le même langage que vous, d’entrer en contact avec eux, d’échanger, d’apprendre et de coder ensemble.

🌐 **Lien du site** : [https://codenest-go66.onrender.com](https://codenest-go66.onrender.com)

---

## Sommaire

- [Fonctionnalités principales](#fonctionnalités-principales)
- [Installation & Lancement](#installation--lancement)
- [Architecture technique](#architecture-technique)
- [Principaux modules](#principaux-modules)
- [API et modèles](#api-et-modèles)
- [Déploiement](#déploiement)
- [Crédits & licences](#crédits--licences)

---

## Fonctionnalités principales

- **Découverte sociale** : Trouver et se connecter à des utilisateurs qui apprennent la même langue de programmation.
- **Onboarding utilisateur** : Complétion de profil (nom, bio, langues, avatar aléatoire, localisation) obligatoire après inscription.
- **Chat en temps réel** : Messagerie instantanée basée sur Stream Chat.
- **Appels vidéo** : Interface d’appel avec gestion des états et partage d’écran.
- **Éditeur de code collaboratif** : Edition et exécution de code multi-langages (JS, Python, Java, etc.) en direct pendant un appel, avec retour de l’exécution via l’API Piston.
- **Gestion d’amis** : Système de demandes d’amitié, recommandations, liste d’amis.
- **Thèmes visuels** : Sélecteur de thèmes avec prévisualisation.
- **Authentification sécurisée** : Inscription, connexion, déconnexion, gestion du token, hachage des mots de passe.

---

## Installation & Lancement

### Prérequis

- Node.js (>= 18)
- MongoDB
- Variables d’environnement (voir `.env.example`)

### Démarrage rapide

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

---

## Architecture technique

- **frontend/** : Application React, gestion d’état avec React Query, pages (onboarding, chat, appel, éditeur de code).
- **backend/** : API Express, contrôleurs (authentification, onboarding, chat, appels), modèles (utilisateur), intégration Stream Chat.
- **constants/** : Listes des langages supportés, versions, thèmes visuels.
- **lib/** : Services API (auth, onboarding, exécution de code, amis, chat, etc.)

---

## Principaux modules

### Frontend

- `src/pages/OnborardingPage.jsx` : Page de configuration initiale du profil utilisateur (formulaire dynamique, génération d’avatar, validation et mutation via React Query).
- `src/components/ThemeSelector.jsx` : Sélecteur de thème visuel.
- `src/components/Output.jsx` : Exécution et affichage des résultats de code via l’API Piston.
- `src/pages/CallPage.jsx` : Gestion de l’appel vidéo, partage d’écran, éditeur collaboratif intégré.
- `src/store/executeCode.js` : Service d’exécution de code distant.

### Backend

- `src/controllers/auth.controller.js` :
  - `inscription` : Création de compte, génération d’avatar, validation.
  - `onboard` : Finalisation du profil, validation des champs requis, mise à jour du statut `isOnBoarded`.
- `src/models/User.js` : Modèle utilisateur (profil, langues, amis, statuts).
- `src/lib/stream.js` : Intégration Stream Chat (création et mise à jour des utilisateurs, gestion des messages et appels).

---

## API et modèles

### Exemple de modèle utilisateur

```js
{
  fullName: String,
  bio: String,
  nativeLanguage: String,
  learningLanguage: String,
  location: String,
  profilePic: String,
  isOnBoarded: Boolean,
  friends: [UserId],
  // ...
}
```

### Contrôleur d’onboarding (extrait)

```js
// backend/src/controllers/auth.controller.js
export async function onboard(req, res) {
  const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;
  if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
    return res.status(400).json({ message: "Veuillez remplir tous les champs" });
  }
  // Mise à jour du profil utilisateur
}
```

### Service d’exécution de code

```js
// frontend/src/store/executeCode.js
export const executeCode = async (language, sourceCode) => {
  const response = await API.post("/execute", {
    language,
    version: LANGUAGE_VERSIONS[language],
    files: [{ content: sourceCode }]
  });
  return response.data;
};
```

---

## Déploiement

Le projet est hébergé sur [Render](https://render.com/) :
- **Backend** : déploiement d’un serveur Node.js/Express connecté à MongoDB et aux services externes (Stream, Piston...).
- **Frontend** : application React servie en mode production.

Pour déployer, configurez vos variables d’environnement dans Render pour chaque service (voir `.env.example`), puis connectez chaque dépôt à Render.

---

## Crédits & licences

- Projet open source par [Saltyway12](https://github.com/Saltyway12)
- Basé sur React, Express, MongoDB, Stream Chat, API Piston.
- Licence : MIT (à compléter selon le fichier LICENSE)

---
