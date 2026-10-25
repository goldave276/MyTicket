# ☁️ Guide de Déploiement Frontend sur Cloudflare Pages - MyTicket

Ce guide détaille la mise en production du frontend Next.js de **MyTicket** sur **Cloudflare Pages**.

---

## 🌟 Pourquoi Cloudflare Pages ?

- **Réseau Edge Mondial** : Cache CDN mondial ultra-rapide avec temps de réponse < 50 ms.
- **Sécurité Intégrée** : Protection DDoS illimitée, WAF Cloudflare, certificat SSL/TLS automatique et gratuit.
- **Déploiements Git Automatisés** : Chaque push sur la branche `main` déclenche un déploiement instantané et génère des URL de prévisualisation par branche.
- **Coût** : Gratuit (bande passante illimitée).

---

## 🛠️ Étape 1 : Créer le projet sur le Dashboard Cloudflare

1. Rendez-vous sur le [Tableau de bord Cloudflare](https://dash.cloudflare.com/) et connectez-vous.
2. Dans le menu de gauche, accédez à **Compute (Workers & Pages)** > **Create application** > onglet **Pages**.
3. Cliquez sur **Connect to Git** et autorisez l'accès à votre compte GitHub.
4. Sélectionnez le dépôt : `goldave276/MyTicket`.

---

## ⚙️ Étape 2 : Configuration du Build sur Cloudflare Pages

Remplissez les champs de configuration exactement comme suit :

| Paramètre | Valeur à renseigner |
| :--- | :--- |
| **Project Name** | `myticket` (ou le nom de votre choix) |
| **Production branch** | `main` |
| **Framework preset** | `Next.js` |
| **Root directory** *(très important)* | `/frontend` |
| **Build command** | `npx @cloudflare/next-on-pages@1` |
| **Build output directory** | `.vercel/output/static` |

---

## 🔒 Étape 3 : Variables d'environnement & Flags de compatibilité

Dans la section **Environment variables (production)** de votre projet Cloudflare Pages, ajoutez :

| Variable | Valeur | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20` | Version Node.js recommandée pour le build |
| `NEXT_PUBLIC_API_URL` | `https://votre-backend.onrender.com/api` | L'URL HTTPS publique de votre API Backend déployée |

### ⚙️ Flag de compatibilité obligatoire :
Dans les paramètres de votre projet Cloudflare Pages (**Settings** > **Functions** > **Compatibility flags**) :
- Ajoutez le flag : `nodejs_compat` pour la production et pour les prévisualisations.

---

## 🛡️ Étape 4 : En-têtes de sécurité HTTP (`_headers`)

Le fichier [`frontend/public/_headers`](file:///c:/Users/MSI/Desktop/myticket/frontend/public/_headers) est automatiquement pris en compte par Cloudflare Pages à chaque déploiement. Il applique :
- `X-Content-Type-Options: nosniff` (protection contre le reniflage MIME).
- `X-Frame-Options: DENY` (protection anti-clickjacking).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(self)` (autorise l'usage de la caméra pour le scanner mobile de billets QR code).

---

## 🔄 Étape 5 : Lier votre domaine personnalisé (Optionnel)

1. Dans votre projet Cloudflare Pages, allez dans **Custom domains**.
2. Cliquez sur **Set up a custom domain** (ex: `tickets.votre-domaine.com`).
3. Si votre domaine est géré par Cloudflare DNS, la validation et l'émission du certificat SSL se feront en moins de 60 secondes.
4. **Pensez à mettre à jour `FRONTEND_URL` sur votre backend** pour autoriser ce domaine dans les politiques CORS !
