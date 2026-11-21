# 🚀 Guide de Déploiement en Production - MyTicket Backend

Ce guide détaille les étapes pour déployer l'API Backend MyTicket et sa base de données PostgreSQL / Supabase en environnement de production.

---

## 📋 Prérequis

1. Un projet **Supabase** configuré avec l'ensemble des migrations appliquées.
2. Un compte sur un hébergeur Cloud supportant Docker :
   * **PaaS recommandés :** Render, Railway, Fly.io, ou Koyeb.
   * **IaaS / VPS :** Serveur Ubuntu avec Docker et Docker Compose installés.
3. Un dépôt GitHub à jour connecté à la plateforme d'hébergement.

---

## 🗄️ Étape 1 : Préparation de la Base de Données (Supabase)

Assurez-vous que toutes les migrations du dossier `backend/supabase/migrations/` ont été exécutées dans l'ordre chronologique sur votre projet Supabase de production :

1. `0001_initial_schema.sql` (Tables, relations et politiques RLS)
2. `0002_rpc_functions.sql` (Fonctions RPC transactionnelles)
3. `0003_organizer_event_reservations.sql`
4. `0004_cancel_event.sql`
5. `0005_profile_and_currency.sql` (Devise XOF, mise à jour profil)
6. `0006_update_event.sql`
7. `0007_statistics.sql` (Fonctions statistiques RPC)
8. `0008_admin_users.sql` (Fonctions de gestion des utilisateurs)
9. `0009_performance_indexes.sql` (Index PostgreSQL & bucket `organizer-documents`)
10. `0010_sql_invariants_and_rls.sql` (Invariants SQL, RLS insertion 'DRAFT' et sécurisation de la RPC `create_reservation`)
11. `0011_event_lifecycle_and_public_details.sql` (Cycle de vie, trigger invariants, annulation atomique, disponibilité publique et protection du rôle organisateur)
12. `0012_organizer_request_description.sql` (Persistance de la description de candidature organisateur 20-1000 caractères)
13. `0013_schedule_finish_expired_events.sql` (Planification automatique horaire du passage à l'état FINISHED via pg_cron)
14. `0014_confirm_online_payment.sql` (Fonction RPC confirm_online_payment pour validation et émission automatique de billets via webhooks Stripe et Mobile Money)
15. `0015_ticket_checkin_and_scanner.sql` (Statut 'USED', colonnes de scan et fonction RPC scan_and_checkin_ticket pour le contrôle d'accès organisateur)
16. `0016_allow_admin_event_creation.sql` (Politique RLS autorisant les administrateurs à créer des événements en statut DRAFT)
17. `0017_admin_hierarchical_permissions.sql` (Permissions hiérarchiques ADMIN et fonction RPC `promote_user_to_admin` restreinte à `service_role`)
18. `0018_audit_security_and_free_events.sql` (Verrouillage `service_role` sur `confirm_online_payment`/`promote_user_to_admin`, nettoyage doublon RLS et confirmation immédiate des événements gratuits `price = 0`)
19. `0019_fix_rls_infinite_recursion.sql` (Résolution de la récursion infinie RLS sur `profiles` via `auth.jwt()` et fonction helper `public.is_admin()`)
20. `0020_admin_delete_or_cancel_event.sql` (Suppression physique pure si 0 réservation ou annulation d'urgence atomique de l'événement et de ses réservations/billets par l'administrateur)
21. `0021_allow_multiple_reservations_per_user.sql` (Suppression de la contrainte restrictive `one_reservation_per_user_event` pour autoriser plusieurs réservations par utilisateur)
22. `0022_event_availability_and_reservations_details.sql` (RPC `get_events_booked_counts` pour le calcul des places restantes et jointure nom/email dans `get_organizer_event_reservations`)

---

## 🌐 Étape 2 : Configuration des Variables d'Environnement

Configurez les variables suivantes dans le tableau de bord de votre hébergeur (ne jamais commiter de fichier `.env`) :

| Variable | Description | Exemple en Production |
| :--- | :--- | :--- |
| `NODE_ENV` | Environnement d'exécution | `production` |
| `PORT` | Port d'écoute du serveur | `3000` (ou fourni par l'hébergeur) |
| `FRONTEND_URL` | Origine(s) autorisée(s) par CORS (séparées par virgule) | `https://myticket.pages.dev` *(interdiction du wildcard `*` en production)* |
| `SUPABASE_URL` | URL de votre instance Supabase | `https://xyzproject.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Clé Anon / Publishable Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé Service Role Supabase (webhooks paiement & script promotion admin) | `eyJhbGciOi...` *(strictement côté serveur)* |
| `PASSWORD_RESET_REDIRECT_URL`| Redirection mot de passe | `https://myticket.pages.dev/auth/reset-password` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe pour paiements CB | `sk_live_...` (optionnelle en dev/simulation) |
| `STRIPE_WEBHOOK_SECRET` | Clé secrète de vérification du webhook Stripe | `whsec_...` (optionnelle en dev) |
| `MOBILE_MONEY_WEBHOOK_SECRET` | Clé secrète de vérification du webhook Mobile Money | `momo_whsec_...` (optionnelle en dev) |
| `SMTP_HOST` | Serveur SMTP (Brevo, Resend, SendGrid) | `smtp-relay.brevo.com` (optionnelle, simulation auto) |
| `SMTP_PORT` | Port SMTP | `587` ou `465` |
| `SMTP_USER` | Identifiant de connexion SMTP | `votre-compte-smtp` |
| `SMTP_PASS` | Mot de passe ou clé API SMTP | `votre-cle-smtp` |
| `SMTP_FROM` | Adresse d'expédition des billets | `"MyTicket" <billetterie@votre-domaine.com>` |


> 🔒 **Règle CORS de production :** L'utilisation de `*` dans `FRONTEND_URL` est strictement interdite lorsque `NODE_ENV=production` et provoquera l'arrêt immédiat du serveur au démarrage pour des raisons de sécurité liées à `credentials: true`.
>
> 🌐 **Reverse Proxies & Rate Limiting :** Lorsque le backend est déployé derrière un reverse proxy (Render, Railway, Nginx), `express-rate-limit` s'appuie sur l'adresse IP distante (`trust proxy: 1` si un seul saut de proxy).

---

## 🐳 Étape 3 : Déploiement du Conteneur Docker

### Option A : Déploiement sur Render (PaaS)
1. Créez un nouveau **Web Service** sur Render lié à votre dépôt GitHub.
2. Choisissez le répertoire racine : `backend`.
3. Environnement : **Docker** (Render détectera automatiquement `backend/Dockerfile`).
4. Ajoutez les variables d'environnement listées à l'étape 2.
5. **Déploiement Automatisé via GitHub Actions (Recommandé) :**
   * Dans Render > Service Backend > **Settings** > **Deploy Hook** : générez ou copiez l'URL de votre Deploy Hook.
   * Désactivez l'option **Auto-Deploy** sur Render pour que seuls les commits ayant réussi tous les tests CI soient déployés.
   * Dans GitHub > Répertoire > **Settings** > **Secrets and variables** > **Actions** : ajoutez le secret `RENDER_DEPLOY_HOOK` avec cette URL.
   * Le job `deploy-render` de `.github/workflows/backend-ci.yml` déclenchera automatiquement Render à chaque push validé sur `main`.

### Option B : Déploiement sur Railway
1. Créez un nouveau projet et liez le dépôt GitHub.
2. Définissez le `Root Directory` sur `/backend`.
3. Ajoutez les variables d'environnement.
4. Railway construit et déploie automatiquement l'image Docker Alpine.

### Option C : Déploiement sur Serveur VPS (Docker Compose)
1. Clonez le dépôt sur votre serveur :
   ```bash
   git clone https://github.com/goldave276/MyTicket.git
   cd MyTicket
   ```
2. Créez le fichier `backend/.env` avec vos variables de production.
3. Lancez le conteneur en arrière-plan :
   ```bash
   docker compose up -d --build
   ```

---

## 🔍 Étape 4 : Vérification et Surveillance

1. **Test de santé du serveur :**
   ```bash
   curl -I https://votre-domaine-api.com/api/health
   ```
   *Réponse attendue : `200 OK` avec `{"message":"API MyTicket operationnelle"}`.*

2. **Vérification globale automatisée en production :**
   Depuis la racine ou le dossier `backend/`, lancez la suite de contrôle en direct :
   ```bash
   npm run verify:prod
   ```
   *Vérifie simultanément l'endpoint de santé Render (<200ms), le catalogue public et la page d'accueil Vercel.*

3. **Test des en-têtes de sécurité :**
   Vérifiez que `X-Content-Type-Options: nosniff` et `X-Frame-Options: SAMEORIGIN` sont bien présents dans les en-têtes de réponse.

4. **Logs applicatifs :**
   Consultez les logs de l'hébergeur pour vous assurer de l'absence d'erreurs de connexion avec Supabase.

---

## ⚡ Étape 5 : Anti-mise en veille & Monitoring H24 (Render Free Tier)

Le plan gratuit de Render met en veille les conteneurs après 15 minutes d'inactivité, causant un délai de démarrage à froid de 30 à 50 secondes.

1. **GitHub Actions Keepalive (Automatisé)** :
   Le fichier [`.github/workflows/keepalive-uptime.yml`](.github/workflows/keepalive-uptime.yml) sonde automatiquement `GET https://myticket-llwf.onrender.com/api/health` toutes les 12 minutes pour maintenir le conteneur actif et chaud.

2. **Sonde Externe Redondante (Recommandé - Gratuit)** :
   - Créez un compte gratuit sur [UptimeRobot](https://uptimerobot.com) ou [BetterStack](https://betterstack.com).
   - Ajoutez un moniteur HTTP(s) pointant sur : `https://myticket-llwf.onrender.com/api/health` avec un intervalle de **5 minutes**.
   - Configurez une alerte email/Discord/Slack en cas d'indisponibilité.

---

## 📦 Étape 6 : Procédure de Sauvegarde & Disaster Recovery

Pour exporter l'état complet de la base de données Supabase (données hors-site horodatées et vérifiées par empreinte SHA-256) :

```bash
cd backend
npm run backup
```

* Le snapshot JSON est généré dans `backend/backups/myticket_backup_<TIMESTAMP>.json`.
* Le répertoire `backups/` est automatiquement ignoré par Git (`.gitignore`).
* En cas de sinistre ou corruption, les données JSON exportées peuvent être réinjectées via script ou SQL seed.

---

### Observabilité, Alerting & Sécurité (Free Tier)

1. **Monitoring Sentry & Alertes Critiques** :
   - Définir `SENTRY_DSN` dans Render (optionnel ; désactivé sans impact si vide) pour remonter automatiquement les exceptions Express avec masquage des en-têtes sensibles (`authorization`, `cookie`, signatures webhooks).
   - Définir `ALERT_EMAIL` (ou `ADMIN_EMAIL`) sur Render pour recevoir des alertes emails immédiates (throttlées à 5 min/contexte) en cas d'échec critique de webhook paiement ou d'erreur serveur `500`.
   - Consulter les logs PostgreSQL / Auth / Edge en direct depuis le tableau de bord Supabase (**Logs Explorer**).

2. **Protection Pre-Commit Anti-Secrets** :
   - Activez le hook local après clonage avec :
     ```bash
     git config core.hooksPath .githooks
     ```
   - Chaque commit exécute `node scripts/check-secrets.mjs` pour bloquer l'ajout accidentel de `.env`, clés Stripe live, JWT ou mots de passe en dur. Le contrôle est également exécuté sur l'ensemble du dépôt dans la CI GitHub Actions.

