# 🚀 Guide de Déploiement Frontend - MyTicket (Vercel)

Ce guide détaille la mise en production de l'application frontend Next.js sur **Vercel**, ainsi que la configuration des variables d'environnement et de la politique CORS avec le backend.

---

## 📋 1. Prérequis

1. Un compte sur [Vercel](https://vercel.com).
2. Le dépôt GitHub du projet connecté à votre compte Vercel.
3. L'API Backend MyTicket déployée et accessible via une URL HTTPS publique (ex. `https://api.myticket.com` ou service Render / Railway / Fly.io).

---

## ⚙️ 2. Configuration du Projet sur Vercel

### Étape A : Importer le dépôt
1. Connectez-vous sur le dashboard Vercel et cliquez sur **"Add New..." > "Project"**.
2. Sélectionnez le dépôt `myticket` dans votre liste GitHub.

### Étape B : Paramètres du projet (*Project Settings*)
- **Framework Preset** : `Next.js` (détecté automatiquement).
- **Root Directory** : Cliquez sur **Edit** et sélectionnez le sous-dossier `frontend`.
- **Build Command** : `npm run build` (ou laissez par défaut).
- **Output Directory** : `.next` (par défaut).
- **Install Command** : `npm install` (par défaut).

### Étape C : Variables d'environnement (*Environment Variables*)
Ajoutez la variable d'environnement publique pour la connexion à l'API :

| Nom de la variable | Valeur Exemple | Environnements |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.myticket.com/api` | Production, Preview, Development |

> ⚠️ **Important** : N'oubliez pas le suffixe `/api` à la fin de l'URL de base si votre serveur Express monte ses routes sous `/api`.

---

## 🔒 3. Configuration CORS côté Backend

Pour que les requêtes du navigateur depuis votre domaine Vercel soient acceptées par l'API Backend Express :

1. Sur votre serveur backend (ou dashboard d'hébergement backend), configurez la variable d'environnement :
   ```env
   FRONTEND_URL=https://votre-projet.vercel.app,https://myticket.com
   ```
2. Si vous utilisez un domaine personnalisé sur Vercel, ajoutez-le également séparé par une virgule.
3. Redémarrez le backend pour appliquer la politique CORS.

---

## 🛡️ 4. Sécurité & En-têtes HTTP

Le fichier [`frontend/vercel.json`](vercel.json) applique automatiquement les en-têtes de sécurité essentiels sur toutes les routes :
- `X-Frame-Options: DENY` (protection anti-clickjacking)
- `X-Content-Type-Options: nosniff` (protection contre le reniflage MIME)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🧪 5. Validation Post-Déploiement (Checklist E2E)

Une fois le déploiement terminé sur Vercel, validez le parcours complet en ligne :

- [ ] **Catalogue Public (`/`)** : Les événements approuvés s'affichent correctement.
- [ ] **Authentification (`/auth/login`, `/auth/signup`)** : Connexion fonctionnelle, stockage du token et redirection.
- [ ] **Réservation de billets** : Création d'une réservation pour un événement futur.
- [ ] **Mes Billets (`/dashboard/tickets`)** : Génération instantanée du QR Code côté client.
- [ ] **Espace Organisateur (`/organizer`)** : Création et soumission d'événement (accessible si rôle `ORGANIZER`).
- [ ] **Espace Administrateur (`/admin`)** : Modération des candidatures et validation d'événements (si rôle `ADMIN`).
