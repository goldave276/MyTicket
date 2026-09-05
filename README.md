# MyTicket

Application web de reservation de tickets pour des evenements.

## Stack technique

- JavaScript : langage utilise pour le frontend et le backend.
- React : bibliotheque utilisee pour construire l'interface utilisateur.
- Next.js : framework frontend base sur React, utilise pour les pages, la navigation et la structure de l'application web.
- Node.js : environnement d'execution JavaScript cote serveur.
- Express : framework utilise pour construire l'API backend et ses routes HTTP.
- PostgreSQL : base de donnees relationnelle utilisee pour les utilisateurs, evenements, reservations et tickets.
- Supabase : plateforme qui fournit PostgreSQL, l'authentification et le stockage des documents.
- Docker : conteneurisation de l'application et preparation des environnements de developpement et de production.
- Git et GitHub : versionnement et collaboration.

## Architecture generale

```text
Utilisateur
    |
    v
Frontend React + Next.js
    |
    | requetes HTTP / JSON
    v
API Backend Node.js + Express
    |
    +--> Middlewares : authentification, autorisation, limitation de debit
    |
    +--> Routes : adresses des endpoints HTTP
    |
    +--> Controllers : reception des requetes et reponses HTTP
    |
    +--> Controllers : regles metier et appels Supabase
    |
    +--> Supabase : PostgreSQL, authentification et stockage
    |
    v
Conteneurs Docker
```

## Organisation du projet

```text
myticket/
├── frontend/
│   └── src/
│       ├── components/    # composants reutilisables de l'interface
│       ├── hooks/         # logique React reutilisable
│       ├── pages/         # pages de l'application
│       ├── services/      # appels vers l'API backend
│       └── App.jsx        # composant racine du frontend
│
├── backend/
│   ├── src/
│   │   ├── config/        # configuration du backend et de Supabase
│   │   ├── controllers/   # traitement des requetes HTTP
│   │   ├── middlewares/   # authentification, roles et validations
│   │   ├── routes/        # definition des endpoints Express
│   │   ├── App.js         # configuration de l'application Express
│   │   └── server.js      # demarrage du serveur Node.js
│   ├── .env               # secrets et configuration locale, jamais commitee
│   └── package.json       # dependances et scripts backend
│
├── docker-compose.yml     # orchestration des conteneurs, si utilise
└── README.md
```

## Responsabilites des technologies

### React et Next.js

Le frontend affiche les pages, les formulaires et les espaces correspondant aux roles `USER`, `ORGANIZER` et `ADMIN`. Il appelle l'API backend et affiche les reponses.

Le frontend ne donne jamais de permission. Cacher un bouton ne protege pas une fonctionnalite.

### Node.js et Express

Le backend expose les endpoints HTTP, verifie l'authentification, controle les roles et applique les regles metier.

Exemple de parcours :

```text
Frontend
  -> POST /api/organizer-requests
  -> middleware d'authentification
  -> controller
  -> service metier
  -> Supabase
  -> reponse JSON au frontend
```

### PostgreSQL et Supabase

PostgreSQL est la base de donnees relationnelle du projet. Supabase fournit cette base ainsi que des services utiles autour d'elle. Le backend communiquera directement avec Supabase ; aucun ORM comme Prisma n'est prevu dans la stack actuelle.

Supabase sera utilise pour :

- stocker les utilisateurs, evenements, reservations et tickets ;
- gerer l'authentification ;
- stocker les justificatifs envoyes par les futurs organisateurs ;
- appliquer les regles d'acces necessaires aux donnees.

Les evolutions de la base doivent etre conservees dans
`backend/supabase/migrations/`. La migration initiale reste a capturer depuis
le schema Supabase existant avant de poursuivre le deploiement.

### Docker

Docker permettra d'executer l'application dans des environnements reproductibles. Les variables sensibles resteront dans des fichiers d'environnement locaux et ne seront jamais publiees sur GitHub.

## Demarrage du backend

Depuis le dossier `backend/` :

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Le serveur local ecoute sur `http://localhost:3000`. La verification de sante
est disponible sur `GET /api/health`.

Pour executer les tests :

```powershell
cd backend
npm test
```

## Demarrage avec Docker

Depuis la racine du projet, apres avoir demarre Docker Desktop :

```powershell
docker compose up --build
```

Le fichier `backend/.env` est utilise uniquement localement par Compose. Il ne
doit jamais etre ajoute a Git. En production, les variables doivent etre
configurees dans le gestionnaire de secrets de la plateforme d'hebergement.

## Checklist avant deploiement

- [ ] `npm test` passe dans `backend/`.
- [ ] Le schema Supabase et ses fonctions RPC sont versionnes dans les migrations.
- [ ] Les variables de production sont configurees hors du depot.
- [ ] L'URL CORS est restreinte au frontend de production.
- [ ] `FRONTEND_URL` contient l'origine exacte du frontend de production.
- [ ] `docker compose up --build` demarre correctement le backend.
- [ ] `GET /api/health` repond correctement depuis l'hebergement.
- [ ] Les logs et alertes de la plateforme sont consultables.

Les pushes et pull requests vers `main` declenchent aussi le workflow GitHub
Actions `.github/workflows/backend-ci.yml`, qui execute automatiquement les
tests du backend.

## Regles metier principales

Un utilisateur commence avec le role `USER`.

Un utilisateur connecte peut demander a devenir organisateur en fournissant notamment :

- le type d'evenement prevu ;
- un justificatif officiel, par exemple une autorisation de la prefecture ;
- les informations necessaires a l'examen de sa demande.

Seul un administrateur peut accepter ou refuser cette demande.

Statuts d'une demande organisateur :

```text
PENDING   # demande envoyee, en attente de verification
APPROVED  # demande acceptee par un administrateur
REJECTED  # demande refusee par un administrateur
```

Lorsque la demande est acceptee :

```text
OrganizerRequest.status = APPROVED
User.role = ORGANIZER
```

Le frontend recharge ensuite le profil confirme par le backend et peut afficher l'espace organisateur sans deconnexion.

Un utilisateur ne peut pas creer une nouvelle demande tant qu'une demande `PENDING` existe deja pour lui.

Lorsque l'organisateur n'a plus aucun evenement actif ou futur a gerer, son role temporaire peut etre retire et il redevient `USER`. Les evenements termines restent conserves pour l'historique.

Statuts d'un evenement :

```text
DRAFT     # brouillon de l'organisateur
PENDING   # envoye a l'administration pour validation
APPROVED  # visible et reservable
REJECTED  # refuse par l'administration
CANCELLED # evenement annule
FINISHED  # evenement termine
```

## Roles et espaces

### USER

- consulter les evenements approuves ;
- reserver une place ;
- consulter ses reservations et ses tickets ;
- gerer son profil ;
- envoyer une demande pour devenir organisateur.

### ORGANIZER

- consulter son tableau de bord ;
- creer et modifier ses evenements ;
- soumettre un evenement a validation ;
- consulter les reservations recues ;
- consulter ses statistiques.

### ADMIN

- gerer les utilisateurs ;
- examiner les demandes d'organisateur ;
- valider ou refuser les evenements ;
- gerer les evenements ;
- gerer les paiements et remboursements ;
- consulter les statistiques globales.

## Principes de securite

- Le backend verifie toujours l'authentification de l'utilisateur.
- Le backend verifie toujours le role et les permissions, meme si une page ou un bouton est cache dans le frontend.
- Les secrets restent dans `.env` et ne sont jamais publies sur GitHub.
- Les donnees envoyees par le frontend doivent etre validees cote backend.
- Les documents justificatifs doivent etre accessibles uniquement aux personnes autorisees.

## Plan d'apprentissage et de developpement

1. comprendre HTTP, Node.js et Express ;
2. concevoir les tables et relations Supabase ;
3. mettre en place l'authentification ;
4. implementer les roles et permissions ;
5. creer les demandes organisateur ;
6. creer les evenements et leur validation ;
7. implementer les reservations et tickets ;
8. ajouter les validations et les tests ;
9. connecter le frontend Next.js a l'API ;
10. containeriser avec Docker ;
11. preparer les variables de production ;
12. deployer et surveiller l'application.

Chaque fonctionnalite doit etre comprise, testee et documentee avant de passer a la suivante.

## Contrat de l'API backend

Toutes les routes protegees utilisent l'en-tete suivant :

```http
Authorization: Bearer <access_token_supabase>
```

### Authentification

| Methode | URL | Auth | Usage |
|---|---|---|---|
| POST | `/api/auth/login` | Non | Connexion email/mot de passe |
| GET | `/api/auth/me` | Oui | Profil et role de l'utilisateur connecte |

### Demandes organisateur

| Methode | URL | Auth | Usage |
|---|---|---|---|
| POST | `/api/organizer-requests` | Oui | Envoyer une demande |
| GET | `/api/organizer-requests` | Oui | Voir ses demandes |

Le corps de la creation contient `eventType` et `documentPath`.

### Evenements

| Methode | URL | Auth | Role | Usage |
|---|---|---|---|---|
| GET | `/api/events/approved` | Non | - | Lister les evenements approuves |
| POST | `/api/events` | Oui | ORGANIZER | Creer un brouillon |
| GET | `/api/events/me` | Oui | ORGANIZER | Lister ses evenements |
| PATCH | `/api/events/:eventId/submit` | Oui | ORGANIZER | Soumettre un evenement |

La validation admin se fait avec `GET /api/admin/events/pending`, puis
`PATCH /api/admin/events/:eventId/approve` ou
`PATCH /api/admin/events/:eventId/reject`.

### Reservations et tickets

| Methode | URL | Auth | Usage |
|---|---|---|---|
| POST | `/api/reservations` | Oui | Reserver des places |
| GET | `/api/reservations/me` | Oui | Voir ses reservations |
| PATCH | `/api/reservations/:reservationId/cancel` | Oui | Annuler une reservation |
| GET | `/api/tickets/me` | Oui | Voir ses tickets |

Le corps d'une reservation contient `eventId` et `quantity`. Une reservation
confirmee genere ses tickets via la fonction PostgreSQL transactionnelle.

### Administration

| Methode | URL | Auth | Role | Usage |
|---|---|---|---|---|
| GET | `/api/admin/organizer-requests` | Oui | ADMIN | Lister les demandes |
| PATCH | `/api/admin/organizer-requests/:requestId/approve` | Oui | ADMIN | Approuver une demande |
| PATCH | `/api/admin/organizer-requests/:requestId/reject` | Oui | ADMIN | Refuser une demande |
| GET | `/api/admin/events/pending` | Oui | ADMIN | Lister les evenements a valider |

Les routes de paiement existent pour le futur flux de paiement, mais les
integrations Stripe, PayPal et Mobile Money restent volontairement reportees.
