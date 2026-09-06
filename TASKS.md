# 🎯 Feuille de Route & Tâches Restantes - MyTicket

Ce document regroupe **l'intégralité des tâches nécessaires pour finaliser le projet MyTicket**, séparées strictement entre le **Frontend** et le **Backend**. Il est synchronisé avec [`PROGRESSION.md`](file:///c:/Users/MSI/Desktop/myticket/PROGRESSION.md).

---

## 🎨 PARTIE 1 : FRONTEND (`frontend/` - Next.js / React)

### 🚀 Phase F1 : Socle & Architecture
- [ ] **F1.1. Client HTTP & Gestion des Tokens**
  - [ ] Créer le client API centralisé dans `src/services/api.js` (Fetch / Axios avec base URL dynamique).
  - [ ] Intercepteur pour injecter automatiquement l'en-tête `Authorization: Bearer <token>`.
  - [ ] Gestion du rafraîchissement automatique des tokens et redirection sur 401.

- [ ] **F1.2. Contexte d'Authentification & Rôles**
  - [ ] Créer `src/context/AuthContext.js` et le hook `src/hooks/useAuth.js`.
  - [ ] Stockage sécurisé de la session Supabase (`localStorage` / Cookies).
  - [ ] Composants de protection de routes `ProtectedRoute` par rôle (`USER`, `ORGANIZER`, `ADMIN`).

- [ ] **F1.3. Système de Design & Composants Communs**
  - [ ] Layout global (Navbar dynamique selon le rôle connecté, Footer).
  - [ ] Composants UI atomiques : Boutons, Inputs, Modals, Loaders, Toasts/Notifications.
  - [ ] Composants métiers : Badge de statut (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), Carte événement, Carte ticket.

---

### 🎟️ Phase F2 : Espace Public & Utilisateur (`USER`)
- [ ] **F2.1. Pages d'Authentification**
  - [ ] Page de connexion (`/login`) avec gestion des erreurs et redirections.
  - [ ] Page d'inscription (`/signup`) avec saisie du nom complet.
  - [ ] Page de demande de réinitialisation de mot de passe (`/password-reset`).

- [ ] **F2.2. Catalogue & Découverte des Événements**
  - [ ] Page d'accueil (`/`) : Affichage de la liste des événements approuvés et futurs.
  - [ ] Barre de recherche et filtres combinés (Recherche texte, Type d'événement, Lieu, Fourchette de prix, Dates).
  - [ ] Page détail d'un événement (`/events/[id]`) avec détails, places restantes, lieu, prix en XOF.

- [ ] **F2.3. Réservations & Billetterie**
  - [ ] Modal / Page de réservation : Sélection de la quantité de places et choix du mode de paiement (`ON_SITE`, etc.).
  - [ ] Page "Mes Billets" (`/tickets`) : Affichage des tickets actifs avec code UUID unique (et QR Code généré).
  - [ ] Page "Mes Réservations" (`/reservations`) : Historique des commandes avec statut et bouton d'annulation.

- [ ] **F2.4. Profil & Demande Organisateur**
  - [ ] Page "Mon Profil" (`/profile`) : Modification du nom complet et consultation de son rôle.
  - [ ] Formulaire "Devenir Organisateur" (`/become-organizer`) : Type d'événement ciblé et téléversement du justificatif officiel.
  - [ ] Suivi en direct du statut de la demande (`PENDING`, `APPROVED`, `REJECTED`).

---

### 🎪 Phase F3 : Espace Organisateur (`ORGANIZER`)
- [ ] **F3.1. Dashboard Organisateur**
  - [ ] Tableau de bord (`/organizer/dashboard`) : Vue d'ensemble de ses événements classés par statut.
  - [ ] Indicateurs clés : Nombre total de places vendues, revenus estimés en XOF.

- [ ] **F3.2. Gestion des Événements**
  - [ ] Formulaire de création d'événement (`/organizer/events/new`) : Titre, description, type, date/heure, lieu, capacité, prix.
  - [ ] Formulaire de modification d'événement brouillon ou rejeté (`/organizer/events/[id]/edit`).
  - [ ] Action "Soumettre à validation" (`PATCH /api/events/:eventId/submit`).
  - [ ] Action "Annuler l'événement" avec confirmation.

- [ ] **F3.3. Gestion des Participants**
  - [ ] Vue détaillée des réservations par événement (`/organizer/events/[id]/reservations`) : Noms des acheteurs, quantités, statuts des paiements.

---

### 🛡️ Phase F4 : Espace Administrateur (`ADMIN`)
- [ ] **F4.1. Modération des Demandes d'Organisateurs**
  - [ ] Page de gestion (`/admin/organizer-requests`) : Liste des demandes en attente (`PENDING`).
  - [ ] Visualisation du justificatif officiel fourni par le demandeur.
  - [ ] Actions "Approuver" (passage du rôle en `ORGANIZER`) et "Refuser" avec motif.

- [ ] **F4.2. Validation des Événements**
  - [ ] Page de modération (`/admin/events`) : Liste des événements soumis en attente de validation.
  - [ ] Revue des détails de l'événement et actions "Valider" (`APPROVED`) ou "Refuser" (`REJECTED`).

- [ ] **F4.3. Gestion des Paiements sur Place**
  - [ ] Page des paiements en attente (`/admin/payments`) : Filtrage des paiements `ON_SITE` en attente.
  - [ ] Action "Confirmer le paiement" (génération et activation des tickets définitifs).

- [ ] **F4.4. Tableau de Bord Global Admin**
  - [ ] Vue synthétique : Nombre d'utilisateurs inscrits, événements actifs, volume total de billets émis.

---

## ⚙️ PARTIE 2 : BACKEND & BASE DE DONNÉES (`backend/` - Express & Supabase)

### 🔎 Phase B0 : Durcissement issu de la revue de code (hors paiements)
- [x] **B0.1. Catalogue public robuste**
  - [x] Valider, normaliser et paginer les filtres de `GET /api/events/approved` avant tout appel Supabase ([`eventQueryValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/eventQueryValidator.js)).
  - [x] Neutraliser les caractères spéciaux dans la recherche PostgREST (`escapePostgrestValue`).
  - [x] Corriger le test de filtres invalides avec rejet 400 immédiat sans appel distant.

- [x] **B0.2. Authentification et accès**
  - [x] Passer le contrôle de compte bloqué en mode fail-closed lorsque la lecture de profil échoue ou est absente.
  - [x] Ajouter des limiteurs dédiés à l'inscription et à la réinitialisation de mot de passe.
  - [x] Centraliser les schémas Zod de validation des entrées HTTP, identifiants et champs métier.

- [x] **B0.3. Justificatifs organisateur**
  - [x] Vérifier que `documentPath` appartient au dossier Storage de l'utilisateur connecté et que le fichier existe ([`organizerDocumentValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/organizerDocumentValidator.js)).
  - [x] Générer les accès avec des URLs signées temporaires (durée 1h), sans jamais exposer de bucket ou chemin public.

- [ ] **B0.4. Configuration et tests**
  - [ ] Interdire `FRONTEND_URL=*` avec `credentials: true` en production et retourner 403 pour une origine refusée.
  - [ ] Isoler les tests unitaires, HTTP et Supabase d'intégration ; ajouter la vérification RLS et concurrence de réservation.
  - [ ] Synchroniser le contrat API et le statut réel de qualité dans la documentation.

> Détail opérationnel complet : [`CODE_REVIEW_ACTION_PLAN.md`](CODE_REVIEW_ACTION_PLAN.md). Le module de paiements est exclu de cette phase à la demande explicite du propriétaire du projet.

### 📊 Phase B1 : Endpoints Complémentaires & Statistiques
- [x] **B1.1. Statistiques Organisateur & Admin**
  - [x] Créer le contrôleur et la route `GET /api/events/organizer/stats` (taux de remplissage, billets vendus, total XOF).
  - [x] Créer le contrôleur et la route `GET /api/admin/stats` (statistiques globales : utilisateurs, événements, chiffre d'affaires global).

- [x] **B1.2. Gestion Administrative des Utilisateurs**
  - [x] Créer `GET /api/admin/users` (liste des utilisateurs et leurs rôles).
  - [x] Créer `PATCH /api/admin/users/:userId/role` (attribution / révocation manuelle d'un rôle `USER`, `ORGANIZER`, `ADMIN`).
  - [x] Créer `PATCH /api/admin/users/:userId/block` (blocage / déblocage d'un compte).

---

### 🗄️ Phase B2 : Base de Données & Supabase
- [x] **B2.1. Stockage des Justificatifs (Supabase Storage)**
  - [x] Configurer / Valider le bucket de stockage sécurisé `organizer-documents` avec restrictions d'accès privées (accessible uniquement par l'auteur et l'administrateur).
- [x] **B2.2. Consolidation & Optimisations**
  - [x] Créer les index sur `events(event_date, status)`, `reservations(user_id, event_id)`, `tickets(user_id, ticket_code)`, `payments` et `organizer_requests` (Migration 0009).
  - [x] Exploiter les fonctions RPC sécurisées dans les contrôleurs (`get_admin_stats`, `get_organizer_stats`, `admin_list_users`, `admin_update_user_role`, `admin_set_user_blocked`).

---

### 💳 Phase B3 : Passerelles de Paiement Réel (Post-MVP)
- [ ] **B3.1. Intégration Mobile Money Togo**
  - [ ] Intégration de l'API Flooz / T-Money via agrégateur (PayGate, Fedapay ou CinetPay).
  - [ ] Webhook de notification de paiement pour valider automatiquement la réservation.
- [ ] **B3.2. Intégration Carte Bancaire (Stripe)**
  - [ ] Création de Session / PaymentIntent Stripe.
  - [ ] Webhook Stripe pour basculer les réservations en `CONFIRMED`.

---

## 🌐 PARTIE 3 : DÉPLOIEMENT & ENVIRONNEMENT

- [x] **D1. Déploiement Backend**
  - [x] Documentation complète du déploiement Docker multi-environnements ([`DEPLOYMENT.md`](file:///c:/Users/MSI/Desktop/myticket/DEPLOYMENT.md)).
  - [x] Configuration des variables de production et politique CORS multi-origines ([`.env.example`](file:///c:/Users/MSI/Desktop/myticket/backend/.env.example)).
  - [x] Point de santé et tests de sécurité validés (`GET /api/health`).

- [ ] **D2. Déploiement Frontend**
  - [ ] Hébergement de l'application Next.js sur **Vercel**.
  - [ ] Configuration de la variable `NEXT_PUBLIC_API_URL`.
  - [ ] Validation complète du parcours utilisateur en ligne (E2E).
