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

---

## 🌐 Étape 2 : Configuration des Variables d'Environnement

Configurez les variables suivantes dans le tableau de bord de votre hébergeur (ne jamais commiter de fichier `.env`) :

| Variable | Description | Exemple en Production |
| :--- | :--- | :--- |
| `NODE_ENV` | Environnement d'exécution | `production` |
| `PORT` | Port d'écoute du serveur | `3000` (ou fourni par l'hébergeur) |
| `FRONTEND_URL` | Origine(s) autorisée(s) par CORS (séparées par virgule) | `https://myticket.vercel.app` *(interdiction du wildcard `*` en production)* |
| `SUPABASE_URL` | URL de votre instance Supabase | `https://xyzproject.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Clé Anon / Publishable Supabase | `eyJhbGciOi...` |
| `PASSWORD_RESET_REDIRECT_URL`| Redirection mot de passe | `https://myticket.vercel.app/auth/reset-password` |

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
5. Déployez le service.

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

2. **Test des en-têtes de sécurité :**
   Vérifiez que `X-Content-Type-Options: nosniff` et `X-Frame-Options: SAMEORIGIN` sont bien présents dans les en-têtes de réponse.

3. **Logs applicatifs :**
   Consultez les logs de l'hébergeur pour vous assurer de l'absence d'erreurs de connexion avec Supabase.
