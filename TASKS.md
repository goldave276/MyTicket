# 🎯 Feuille de Route & Tâches Restantes - MyTicket

Ce document regroupe **l'intégralité des tâches nécessaires pour finaliser le projet MyTicket**, séparées strictement entre le **Frontend** et le **Backend**. Il est synchronisé avec [`PROGRESSION.md`](file:///c:/Users/MSI/Desktop/myticket/PROGRESSION.md).

---

## 🎨 PARTIE 1 : FRONTEND (`frontend/` - Next.js / React)

### 🚀 Phase F1 : Socle & Architecture
- [x] **F1.1. Client HTTP & Gestion des Tokens**
  - [x] Créer le client API centralisé dans `src/services/api.js` (Fetch avec base URL dynamique `NEXT_PUBLIC_API_URL`).
  - [x] Intercepteur pour injecter automatiquement l'en-tête `Authorization: Bearer <token>`.
  - [ ] Gestion du rafraîchissement automatique des tokens (actuellement : nettoyage du token et redirection réactive sur 401 uniquement, pas de refresh proactif avant expiration).

- [x] **F1.2. Contexte d'Authentification & Rôles**
  - [x] Créer `src/context/AuthContext.jsx` et le hook `src/hooks/useRequireAuth.js` (garde d'accès par rôle, ex-doublon dans 11 pages, factorisé le 15/09/2026).
  - [x] Stockage de la session (`localStorage`, token + profil).
  - [x] Garde de page par rôle (`USER`, `ORGANIZER`, `ADMIN`) via `useRequireAuth({ role })` — la permission réelle reste toujours vérifiée côté backend.

- [x] **F1.3. Système de Design & Composants Communs**
  - [x] Layout global (Navbar dynamique selon le rôle connecté, Footer).
  - [x] Composants UI atomiques : Modal, Skeleton, Toasts (`ToastContext`), `ErrorState` (état d'erreur réel avec relance, ajouté le 15/09/2026).
  - [x] Composants métiers : Badge de statut (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), Carte événement, Carte ticket.

---

### 🎟️ Phase F2 : Espace Public & Utilisateur (`USER`)
- [x] **F2.1. Pages d'Authentification**
  - [x] Page de connexion (`/auth/login`) avec gestion des erreurs et redirections.
  - [x] Page d'inscription (`/auth/signup`) avec saisie du nom complet.
  - [x] Page de demande de réinitialisation de mot de passe (`/auth/password-reset`).

- [x] **F2.2. Catalogue & Découverte des Événements**
  - [x] Page d'accueil (`/`) : Affichage de la liste des événements approuvés et futurs, avec état d'erreur réel (plus de données factices depuis le 15/09/2026).
  - [x] Barre de recherche et filtres combinés (Recherche texte, Type d'événement, Lieu, Fourchette de prix).
  - [ ] Filtres de dates (`dateFrom`/`dateTo`, pourtant supportés par l'API) non exposés dans `EventFilters`.
  - [x] Page détail d'un événement (`/events/[id]`) avec détails, places restantes, lieu, prix en XOF.

- [x] **F2.3. Réservations & Billetterie**
  - [x] Réservation : sélection de la quantité de places (paiement `ON_SITE` implicite, pas de paiement réel — hors périmètre).
  - [x] Page "Mes Billets" (`/dashboard/tickets`) : tickets avec QR Pass généré **côté client** (`qrcode.react`, corrigé le 15/09/2026 — n'envoie plus les données du billet à un service tiers).
  - [x] Page "Mes Réservations" (`/dashboard`) : historique des commandes avec statut et bouton d'annulation.

- [x] **F2.4. Profil & Demande Organisateur**
  - [x] Page "Mon Profil" (`/dashboard/profile`) : modification du nom complet et consultation de son rôle.
  - [x] Formulaire "Devenir Organisateur" (`/dashboard/become-organizer`) : type d'événement ciblé, justificatif et description de l'activité (persistée et contrainte à 20-1000 caractères).
  - [x] Téléversement réel du justificatif vers Supabase Storage (PDF, JPG, PNG, max 5 Mo) avec préfixe utilisateur sécurisé, vérification de type/taille et stockage dans `organizer-documents`.
  - [x] Suivi en direct du statut de la demande (`PENDING`, `APPROVED`, `REJECTED`).

---

### 🎪 Phase F3 : Espace Organisateur (`ORGANIZER`)
- [x] **F3.1. Dashboard Organisateur**
  - [x] Tableau de bord (`/organizer`) : vue d'ensemble de ses événements classés par statut.
  - [x] Indicateurs clés : nombre total de places vendues, revenus estimés en XOF (affichent 0/— tant que la RPC stats ne répond pas, plus de chiffres inventés depuis le 15/09/2026).

- [x] **F3.2. Gestion des Événements**
  - [x] Formulaire de création d'événement (`/organizer/events/create`) : titre, description, type, date/heure, lieu, capacité, prix.
  - [x] Formulaire de modification d'événement brouillon ou rejeté (modale `EventFormModal` sur `/organizer/events`).
  - [x] **Corrigé le 15/09/2026** : les deux formulaires envoyaient `{date, totalTickets, imageUrl}` alors que l'API attend `{eventDate, capacity}` — toute création/édition était rejetée. Le mapping est désormais centralisé dans `eventService`.
  - [x] Action "Soumettre à validation" (`PATCH /api/events/:eventId/submit`).
  - [x] Action "Annuler l'événement" avec confirmation.

- [x] **F3.3. Gestion des Participants**
  - [x] Vue détaillée des réservations par événement (`/organizer/events/[id]/reservations`) : noms des acheteurs, quantités, statuts.

---

### 🛡️ Phase F4 : Espace Administrateur (`ADMIN`)
- [x] **F4.1. Modération des Demandes d'Organisateurs**
  - [x] Page de gestion (`/admin/organizer-requests`) : liste des demandes en attente (`PENDING`).
  - [x] Visualisation et lecture de la description détaillée de l'activité du demandeur dans la liste admin.
  - [x] Visualisation et ouverture du justificatif officiel fourni par le demandeur grâce au lien signé temporaire (1 heure).
  - [x] Actions "Approuver" (passage du rôle en `ORGANIZER`) et "Refuser" avec motif.

- [x] **F4.2. Validation des Événements**
  - [x] Page de modération (`/admin/events-pending`) : liste des événements soumis en attente de validation.
  - [x] Revue des détails de l'événement et actions "Valider" (`APPROVED`) ou "Refuser" (`REJECTED`).

- [x] **F4.3. Gestion des Paiements sur Place**
  - [x] Page des paiements en attente (`/admin/payments`) : filtrage des paiements `ON_SITE` en attente.
  - [x] Action "Confirmer le paiement" (génération et activation des tickets définitifs).

- [x] **F4.4. Tableau de Bord Global Admin**
  - [x] Vue synthétique (`/admin`) : nombre d'utilisateurs inscrits, événements actifs, demandes/événements en attente.

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
  - [x] Centraliser les schémas Zod de validation des entrées HTTP (politique de mot de passe durcie : >=8 chars, lettre + chiffre) et protection anti-énumération d'email.

- [x] **B0.3. Justificatifs organisateur**
  - [x] Vérifier que `documentPath` appartient au dossier Storage de l'utilisateur connecté et que le fichier existe ([`organizerDocumentValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/organizerDocumentValidator.js)).
  - [x] Générer les accès avec des URLs signées temporaires (durée 1h), sans jamais exposer de bucket ou chemin public.

- [x] **B0.4. Configuration et tests**
  - [x] Interdire `FRONTEND_URL=*` avec `credentials: true` en production et retourner 403 (`CORS_ORIGIN_DENIED`) pour une origine refusée.
  - [x] Isoler les tests unitaires (`npm run test:unit`) et HTTP (`npm run test:http`) ; intégrer les validateurs Zod métier (`eventValidator.js`, `reservationValidator.js`).
  - [x] Synchroniser le contrat API et le statut réel de qualité dans la documentation (`README.md`, `DEPLOYMENT.md`, `TASKS.md`, `PROGRESSION.md`).

- [x] **B0.5. Invariants SQL/RLS et cohérence métier — priorité P0**
  - [x] Créer une migration qui interdit l'insertion directe d'un événement dans tout statut autre que `DRAFT` ([`0010_sql_invariants_and_rls.sql`](file:///c:/Users/MSI/Desktop/myticket/backend/supabase/migrations/0010_sql_invariants_and_rls.sql)).
  - [x] Définir côté PostgreSQL les invariants non contournables : statut initial 'DRAFT', capacité maximale (<= 100 000) et intégrité système.
  - [x] Modifier la RPC `create_reservation` afin de refuser tout événement avec `event_date <= now()` et basculer les événements échus en `FINISHED`.
  - [x] Remplacer les conversions JavaScript non sûres des IDs `bigint` par une validation sans perte de précision (`Number.isSafeInteger` dans [`eventValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/eventValidator.js) et [`reservationValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/reservationValidator.js)).
  - [x] Faire utiliser à `createReservation` son validateur dédié, appliquer la limite métier de quantité (1..100) et retourner 400 pour un corps absent/invalide.
  - [x] Ajouter des tests de validation et de robustesse des invariants ([`sql-invariants-and-rls.test.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/tests/sql-invariants-and-rls.test.js)).
  - [x] Supprimer les fallbacks de statistiques qui retournent des données incomplètes sous RLS ; répondre 500 en cas d'erreur de la RPC.

- [x] **B0.6. Cycle de vie événement, contrat API et exploitation — priorité P1**
  - [x] Corriger `create_reservation` dans une nouvelle migration : l'`UPDATE ... status = 'FINISHED'` suivi d'un `RAISE EXCEPTION` est annulé par rollback. Mettre le passage en `FINISHED` dans une tâche planifiée/transaction distincte, ou ne pas lever d'exception après la mise à jour selon le contrat retenu ([`0011_event_lifecycle_and_public_details.sql`](file:///c:/Users/MSI/Desktop/myticket/backend/supabase/migrations/0011_event_lifecycle_and_public_details.sql)).
  - [x] Ajouter une garantie SQL pour les données d'événement créées directement via Supabase : date future au moment de la création/modification, tailles maximales des textes et plafond de prix. Ne pas utiliser un `CHECK (event_date > now())` instable ; utiliser une RPC unique ou un trigger `BEFORE INSERT OR UPDATE` (`enforce_event_invariants_before_write`).
  - [x] Définir puis implémenter la règle métier d'annulation d'un événement : désactiver les tickets déjà émis et mettre à jour les réservations concernées de façon transactionnelle. Les remboursements et paiements restent hors périmètre (`cancel_event`).
  - [x] Ajouter l'endpoint public de détail d'événement annoncé par le produit, avec disponibilité calculée de manière atomique/sûre (`capacity - réservations PENDING/CONFIRMED`). Le placer dans le routeur sans entrer en conflit avec `/approved`, `/me`, `/stats` et les routes organisateur (`GET /api/events/:eventId` + RPC `get_public_event_detail`).
  - [x] Implémenter ou retirer du README la révocation du rôle `ORGANIZER` lorsqu'aucun événement actif ou futur ne reste à gérer ; prévoir une RPC/admin action vérifiant les invariants avant rétrogradation (`admin_update_user_role` dans migration 0011).
  - [x] Configurer `app.set('trust proxy', 1)` uniquement pour les hébergeurs à un saut de proxy documentés, ou rendre ce réglage configurable. Aligner le code avec `DEPLOYMENT.md` pour que le rate limiting utilise la vraie IP (`TRUST_PROXY=1`).
  - [x] Retirer les contrôleurs dupliqués et non branchés (`userController.js`, `statsController.js`) ou les connecter explicitement ; une seule implémentation doit définir le contrat admin/statistiques.
  - [x] Supprimer le fallback `getAllUsers` qui peut retourner une liste partielle sous RLS si `admin_list_users` échoue ; retourner une erreur contrôlée tant qu'une RPC admin ne répond pas.
  - [x] Mettre à jour le README : 107 tests actuels (et non 90), paramètres `page`/`limit` du catalogue, état réel du frontend, et distinction entre validation structurelle CI et tests RLS exécutés avec des identités Supabase.
  - [x] Ajouter des tests d'intégration avec Supabase local/projet isolé : JWT utilisateur/organisateur/admin, policy RLS réelle, transition `FINISHED`, annulation et désactivation de ticket, calcul de places restantes, et concurrence de réservation ([`sql-invariants-and-rls.test.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/tests/sql-invariants-and-rls.test.js), [`event-public-detail.test.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/tests/event-public-detail.test.js)).

- [x] **B0.7. Tests déterministes et port officiel 3333 — priorité P0 (HANDOFF, 24/10/2026)**
  - [x] Aligner les 4 tests CORS sur l'origine officielle `http://localhost:3333` (au lieu de 3001).
  - [x] Rendre la suite indépendante du `.env` local via [`setup-env.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/tests/setup-env.js) (`setupFiles` Vitest).
  - [x] Corriger la casse `require("../App")` pour l'exécution sous Linux (Docker/CI).
  - [x] Réduire l'origine CORS par défaut de `App.js` à `http://localhost:3333`.
  - [ ] Vérifier l'exécution sur une machine/CI sans aucun `.env` (valeurs Supabase factices non encore éprouvées).

- [x] **B0.8. Persistance et validation de la description de candidature organisateur — priorité P1 (HANDOFF, 24/10/2026)**
  - [x] Migration SQL [`0012_organizer_request_description.sql`](file:///c:/Users/MSI/Desktop/myticket/backend/supabase/migrations/0012_organizer_request_description.sql) (colonne `description`, contrainte `CHECK` 20 à 1000 caractères, policy RLS insertion).
  - [x] Validation côté backend dans [`organizerDocumentValidator.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/organizerDocumentValidator.js) et insertion dans [`organizerRequestController.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/controllers/organizerRequestController.js).
  - [x] Frontend : compteur de caractères et contraintes min/max dans [`become-organizer.js`](file:///c:/Users/MSI/Desktop/myticket/frontend/src/pages/dashboard/become-organizer.js) ; affichage complet multi-lignes dans [`admin/organizer-requests.js`](file:///c:/Users/MSI/Desktop/myticket/frontend/src/pages/admin/organizer-requests.js).
  - [x] Tests unitaires associés et vérification des invariants SQL (109/109 tests validés).

- [x] **B0.9. Téléversement réel du justificatif organisateur et lien signé admin — priorité P1 (HANDOFF, 24/10/2026)**
  - [x] Fonction de validation de fichier téléversé [`validateOrganizerUploadedFile`](file:///c:/Users/MSI/Desktop/myticket/backend/src/validators/organizerDocumentValidator.js) (formats PDF, JPG, PNG, max 5 Mo).
  - [x] Téléversement automatique vers Supabase Storage `organizer-documents` avec préfixe `<userId>/<timestamp>_<filename>` dans [`organizerRequestController.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/controllers/organizerRequestController.js).
  - [x] Support des requêtes JSON jusqu'à 10 Mo dans [`App.js`](file:///c:/Users/MSI/Desktop/myticket/backend/src/App.js).
  - [x] Interface de téléversement avec sélecteur de fichier dans [`become-organizer.js`](file:///c:/Users/MSI/Desktop/myticket/frontend/src/pages/dashboard/become-organizer.js).
  - [x] Bouton/lien sécurisé d'ouverture du justificatif (URL signée 1h) dans [`admin/organizer-requests.js`](file:///c:/Users/MSI/Desktop/myticket/frontend/src/pages/admin/organizer-requests.js).
  - [x] Tests unitaires d'upload et contrôleur (111/111 tests validés).

- [x] **B0.10. Automatisation de la clôture des événements expirés via pg_cron — priorité P1 (HANDOFF, 24/10/2026)**
  - [x] Migration SQL [`0013_schedule_finish_expired_events.sql`](file:///c:/Users/MSI/Desktop/myticket/backend/supabase/migrations/0013_schedule_finish_expired_events.sql) activant l'extension `pg_cron` et planifiant l'exécution horaire (`0 * * * *`) de `finish_expired_events()`.
  - [x] Tests unitaires d'invariants SQL validant la structure de la migration 0013 (112/112 tests validés).



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
