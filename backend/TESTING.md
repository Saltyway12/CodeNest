# CodeNest — Backend Testing Plan (Pre-Validation)

Ce document décrit l’ensemble des tests à exécuter sur le backend refactorisé.  
⚠️ Aucun test n’est encore validé.  
Ce fichier sert de **plan QA** et sera mis à jour au fur et à mesure des tests.

---

## 1. AUTHENTICATION

### 1.1 POST /auth/signup

- [ ] Création d’un utilisateur valide
- [ ] Refus si email déjà utilisé
- [ ] Refus si password manquant
- [ ] Refus si email invalide
- [ ] Password hashé en base
- [ ] Cookie JWT correctement retourné
- [ ] Mauvais payload → 400

### 1.2 POST /auth/login

- [ ] Connexion avec credentials valides
- [ ] Refus credentials invalides
- [ ] Cookie JWT retourné
- [ ] Activation du rate limiter après X tentatives incorrectes
- [ ] Payload invalide → 400
- [ ] Token valide présent dans les cookies après login

### 1.3 GET /auth/me

- [ ] Retourne l’utilisateur connecté
- [ ] 401 si pas de cookie JWT
- [ ] Format JSON attendu

---

## 2. USERS

### 2.1 PATCH /users/me

- [ ] Mise à jour valide
- [ ] Rejet des champs non autorisés (à améliorer)
- [ ] 401 si non authentifié
- [ ] Mise à jour correcte en base
- [ ] Email invalide → 400

### 2.2 GET /users/:id

- [ ] Récupération d’un utilisateur existant
- [ ] ID au mauvais format → 400
- [ ] Utilisateur inexistant → 404
- [ ] Format JSON conforme

---

## 3. FRIEND SYSTEM

### 3.1 POST /users/send/:id

- [ ] Envoi valide d’une demande d’ami
- [ ] Rejet auto-demande
- [ ] Rejet si user inexistant
- [ ] Rejet si demande déjà envoyée
- [ ] Rejet si les deux users sont déjà amis
- [ ] Demande créée en statut "pending"

### 3.2 POST /users/accept/:requestId

- [ ] Acceptation valide d’une demande
- [ ] Les deux utilisateurs deviennent amis
- [ ] Statut mis à jour → "accepted"
- [ ] ID invalide → 400
- [ ] Demande inexistante → 404
- [ ] Rejet si la demande appartient à un autre utilisateur

### 3.3 GET /users/friends

- [ ] Retourne la liste des amis
- [ ] Liste vide si aucun ami
- [ ] 401 si non authentifié

---

## 4. CHAT SYSTEM

### 4.1 POST /chat/create-room

- [ ] Création d’une room entre deux amis
- [ ] Rejet si non amis
- [ ] Retour roomId
- [ ] Room persistée correctement
- [ ] ID invalide → 400

### 4.2 GET /chat/rooms

- [ ] Retourne les rooms de l’utilisateur
- [ ] Liste vide si aucune room
- [ ] 401 si non authentifié

---

## 5. WEBSOCKET TESTING

### 5.1 Connexion WS

- [ ] Connexion WS réussie
- [ ] Reconnexion après refresh
- [ ] Gestion multi-onglets

### 5.2 Messaging

- [ ] Envoi d’un message dans une room
- [ ] Réception par l’autre utilisateur
- [ ] Isolation : seuls les membres de la room reçoivent le message
- [ ] Multi-rooms : aucun leak entre rooms

### 5.3 Robustesse

- [ ] Déconnexion propre
- [ ] Reconnexion automatique stable
- [ ] Résilience onglet fermé
- [ ] Résilience changement de page

---

## 6. SECURITY

### 6.1 Rate Limiting

- [ ] Blocage après X tentatives incorrectes
- [ ] Message d’erreur clair
- [ ] Déblocage après délai prévu

### 6.2 JWT / Cookies

- [ ] Cookie httpOnly
- [ ] Cookie Secure activé en production
- [ ] Expiration correcte
- [ ] Rejet si token falsifié

### 6.3 Validation des payloads

- [ ] Champs inattendus rejetés (non implémenté → non bloquant)
- [ ] Types invalides → 400
- [ ] Formats invalides → 400

---

## 7. DATABASE CONSISTENCY

- [ ] Modèle User cohérent après signup
- [ ] Modèle FriendRequest cohérent
- [ ] Pas de duplications d’amis
- [ ] Statuts correctement mis à jour
- [ ] Tests workflow complet :
      signup → login → send request → accept → room → message WS

---

## 8. FULL WORKFLOW TEST (E2E)

- [ ] User A signup + login
- [ ] User B signup + login
- [ ] A envoie une demande à B
- [ ] B accepte
- [ ] /users/friends retourne bien les deux users
- [ ] Création room entre A et B
- [ ] Messages échangés via WS
- [ ] Déconnexion / reconnexion sans perte de contexte

---

## Status

- Plan QA établi
- Tests non exécutés pour le moment
- Le dossier sera mis à jour après validation
