# HANDOFF — MyTicket

Document de reprise destiné à une IA ou à un développeur qui ne dispose pas de l’historique des échanges. Il décrit l’état observé dans le dépôt local `main` au commit `dc8cbce` (dépôt propre, aligné sur `origin/main` au moment de l’audit). Les constats portent sur le code et les fichiers suivis ; ils ne prouvent pas l’état d’un projet Supabase distant ni d’un déploiement en ligne.

## 1. Objectif et public de l’application

**[FAIT]** MyTicket est une application web de découverte d’événements, de réservation de places et de gestion de billets. Le README la présente comme une plateforme de réservation/vente de billets. Le frontend propose un catalogue public, une authentification, un parcours de réservation, un espace utilisateur, un espace organisateur et un espace d’administration.

Publics visés :

- **USER** : visiteur ou client qui consulte les événements, crée un compte, réserve et consulte ses billets.
- **ORGANIZER** : organisateur accrédité qui crée des événements, les soumet à validation et suit les réservations/statistiques.
- **ADMIN** : équipe de la plateforme qui examine les demandes organisateur, modère les événements, gère les comptes et consulte les statistiques.

Parcours principal constaté : inscription/connexion → consultation d’événements approuvés → création d’une réservation `PENDING` → création d’un enregistrement de paiement → confirmation sur place par l’administration, qui confirme la réservation et produit les billets. Le parcours de paiement en ligne n’est pas intégré. Un utilisateur peut demander les droits organisateur avec un justificatif ; l’administration peut accepter ou refuser la demande. Les événements créés démarrent en brouillon et doivent être soumis puis approuvés avant leur exposition publique.

**[MÉMOIRE]** Le brief historique confirme l’intention générale de billetterie événementielle et les trois rôles. L’exigence métier envisagée est de demander les pièces justificatives lors de la candidature organisateur, pas à chaque création d’événement ; le code conserve un chemin de document par demande.

## 2. Décisions prises et raisons

### Décisions vérifiées dans le dépôt

- **[FAIT]** JavaScript côté frontend et backend ; frontend Next.js avec React, routes de type Pages Router dans `frontend/src/pages/`; backend Node.js/Express modulaire (`backend/src/routes`, `controllers`, `middlewares`, `validators`).
- **[FAIT]** Supabase est utilisé comme fournisseur PostgreSQL, Auth et Storage. Le backend construit des clients Supabase avec la clé publishable et, pour les requêtes authentifiées, transmet le bearer token de l’utilisateur (`backend/src/config/supabase.js`). Les contrôles et permissions reposent donc aussi sur RLS et les fonctions SQL, pas seulement sur l’interface.
- **[FAIT]** Le schéma et les fonctions SQL sont versionnés dans `backend/supabase/migrations/`; les RPC encapsulent des opérations atomiques comme la réservation, l’approbation et l’annulation.
- **[FAIT]** Les contrôles de rôle existent sur les routes Express (`requireAuth`, `requireRole`) et les opérations privilégiées sont protégées côté serveur. Les politiques RLS fournissent une deuxième frontière d’accès.
- **[FAIT]** Les documents organisateur sont destinés à un bucket Storage privé `organizer-documents`, avec politiques séparées pour l’auteur et les admins (migration `0009_performance_indexes.sql`, autour des lignes 40–61). Les demandes validées sont enrichies d’URLs signées à durée d’une heure dans `organizerRequestController.js`.
- **[FAIT]** Les événements ont les états `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `FINISHED`; une migration ajoute des invariants DB sur statut initial, date, capacité, prix et longueurs de champs (`0011_event_lifecycle_and_public_details.sql`).
- **[FAIT]** La réservation est transactionnelle via RPC et réserve la capacité pour les statuts `PENDING` et `CONFIRMED` ; l’annulation d’événement met à jour événement, réservations et billets dans la même fonction SQL.
- **[FAIT]** Docker ne sert qu’au backend dans le `docker-compose.yml` actuel. Le Dockerfile utilise Node 24 Alpine et un compte non-root.
- **[FAIT]** Les dépendances du backend incluent `stripe`, mais aucune utilisation de Stripe ou de SDK PayPal/Mobile Money n’a été trouvée dans le code applicatif. La dépendance seule ne constitue pas une intégration.

### Décisions historiques et points à confirmer

- **[MÉMOIRE]** Les rôles prévus sont USER, ORGANIZER et ADMIN ; les justificatifs doivent être fournis au moment de la demande d’accréditation et examinés par un admin.
- **[FAIT]** Une rétrogradation `ORGANIZER` → `USER` est protégée par la RPC `admin_update_user_role` si l’organisateur possède encore des événements actifs ou futurs (`0011_event_lifecycle_and_public_details.sql`, vers la ligne 219 et suivantes). **[INCONNU]** Aucun ordonnanceur configuré dans le dépôt n’exécute automatiquement `finish_expired_events()` ; la fréquence et le mécanisme d’exécution doivent être confirmés côté Supabase/hébergement.
- **[MÉMOIRE]** Le brief indique que l’idée initiale d’une expiration automatique du rôle après un événement n’était pas considérée comme définitivement arrêtée, notamment pour les organisateurs ayant plusieurs événements. Le comportement SQL actuel est plus précis : un admin peut rétrograder seulement quand aucun événement actif/futur ne subsiste ; ce n’est pas une révocation automatique à la fin de chaque événement.
- **[FAIT]** `backend/supabase/README.md` contient des passages manifestement anciens (par exemple, il décrit les deux premières migrations comme le périmètre disponible et annonce un workflow GitHub Actions). Le dépôt actuel contient les migrations 0001 à 0011 et aucun workflow `.github` suivi. Préférer les migrations/code et l’historique Git actuel à ces passages.

## 3. Idées abandonnées ou exclues

- **Paiement réel par carte / Stripe, PayPal et Mobile Money : [FAIT — absent/non intégré].** `TASKS.md` classe Stripe et Mobile Money Togo en post-MVP ; le README dit que les passerelles réelles sont reportées. Aucun webhook, PaymentIntent, checkout ou client PSP effectif n’a été trouvé. Le backend accepte des méthodes telles que `CARD`, `PAYPAL`, `MOBILE_MONEY`, mais crée seulement un enregistrement DB d’intention. Ce n’est pas un paiement réel.
- **Paiement sur place : [FAIT — partiel].** Le backend peut lister les paiements `ON_SITE` en attente et les confirmer par RPC admin ; cette confirmation génère/active les billets. La page d’administration de paiement n’est pas présente dans le frontend (`TASKS.md`, section F4.3 non cochée). La boucle utilisateur complète n’est donc pas démontrée.
- **Upload du justificatif : [FAIT — incomplet].** Le formulaire demande le nom d’un fichier déjà présent dans le stockage et l’API vérifie son existence. Aucun composant d’upload, appel Storage `upload` ni endpoint d’upload n’a été trouvé dans le frontend/backend. Le chemin attendu est néanmoins contrôlé et le bucket privé est décrit par les migrations.
- **Intégration CI GitHub Actions : [FAIT — retirée].** Le workflow `.github/workflows/backend-ci.yml` n’est pas dans l’arbre Git courant. `git log` confirme son retrait dans le commit `0527f05` (« At the user's request »). Les documents qui affirment qu’il est encore actif sont obsolètes.
- **Réécriture d’architecture ou ORM :** aucun ORM n’est utilisé ; aucune décision de migration d’architecture n’est justifiée par les éléments trouvés.

## 4. Stack, architecture et organisation des fichiers

### Stack réellement déclarée

| Couche | Technologie observée | Preuve |
|---|---|---|
| Frontend | Next.js 16.3.4, React/React DOM 19.2.8, JavaScript, Tailwind CSS 4 | `frontend/package.json` |
| Backend | Node.js 24 Alpine en conteneur, Express 5.2.1, CommonJS | `backend/package.json`, `backend/Dockerfile` |
| Validation | Zod 4 dans les validateurs backend | `backend/package.json`, `backend/src/validators/` |
| Auth / DB / stockage | `@supabase/supabase-js` 2.x, PostgreSQL via Supabase | `backend/src/config/supabase.js`, `backend/supabase/` |
| Sécurité HTTP | Helmet, CORS, express-rate-limit | `backend/src/App.js`, `backend/src/routes/authRoutes.js` |
| Tests | Vitest 5, Supertest 7 | `backend/package.json`, `backend/vitest.config.mjs` |
| Billetterie visuelle | `qrcode.react` génère le QR côté client | `frontend/package.json`, dashboard tickets |
| Conteneurs | Docker Compose + Dockerfile backend | `docker-compose.yml`, `backend/Dockerfile` |

Les versions des dépendances sont des plages semver, sauf versions frontend Next/React épinglées directement dans `package.json`; le lockfile définit les résolutions réellement installées.

### Arborescence représentative

```text
.
├── README.md                         # description générale, API, règles métier
├── TASKS.md                          # backlog fonctionnel et technique
├── PROGRESSION.md                    # suivi/journal, certaines entrées datées sont anciennes
├── CODE_REVIEW_ACTION_PLAN.md        # actions issues de revues antérieures
├── DEPLOYMENT.md                     # procédure de déploiement backend
├── docker-compose.yml                # lance uniquement le backend
├── backend/
│   ├── src/App.js, server.js         # Express et démarrage
│   ├── src/routes/                   # API par domaine
│   ├── src/controllers/              # traitement et appels Supabase/RPC
│   ├── src/middlewares/              # authentification et rôles
│   ├── src/validators/               # validation entrées et règles de format
│   ├── src/config/supabase.js        # client Supabase
│   ├── src/tests/                    # tests Vitest/Supertest et tests de SQL statiques
│   └── supabase/migrations/          # 001 à 011 : tables, RPC, RLS, invariants
└── frontend/
    ├── src/pages/                    # Pages Router public, auth, user, admin, organizer
    ├── src/components/               # layout, événements, dashboard, composants communs
    ├── src/context/AuthContext.jsx   # session UI
    ├── src/hooks/useRequireAuth.js   # gardes d’interface selon rôle
    └── src/services/                 # appels HTTP vers API backend
```

### Flux et responsabilités

1. Le navigateur appelle les services frontend (`frontend/src/services/api.js`) qui ajoutent `Authorization: Bearer …` depuis le stockage local.
2. Express monte les routeurs dans `backend/src/App.js` (`/api/auth`, `/api/events`, `/api/reservations`, `/api/tickets`, `/api/payments`, `/api/admin`, `/api/organizer-requests`). Le middleware valide le token Supabase et installe un client limité au JWT utilisateur (`authMiddleware.js`, `config/supabase.js`). Les routeurs admin/organizer demandent en plus le rôle serveur.
3. Les contrôleurs lisent/écrivent les tables Supabase ou appellent les RPC transactionnelles. PostgreSQL/RLS décide l’accès aux données pour l’identité de l’utilisateur ; les RPC `SECURITY DEFINER` ont des `search_path` fixés dans les migrations.
4. Les documents sont stockés dans le bucket privé ; le backend vérifie que le chemin commence par l’UUID du demandeur, vérifie l’existence du fichier puis produit des URLs signées temporaires pour les listes de demandes.
5. Docker Compose construit et expose seulement l’API backend sur le port 3000 ; le frontend se lance séparément sur le port 3333 en développement. Les migrations ne sont pas exécutées automatiquement par le serveur ni par Compose.

**[INCONNU]** Le dépôt ne prouve pas quelles migrations ont été appliquées sur le projet Supabase réel, la configuration du cron, ni quels services/données sont actuellement déployés.

## 5. État actuel des fonctionnalités

Statut d’implémentation et certitude sont distincts : les étiquettes **[FAIT]**, **[MÉMOIRE]**, **[HYPOTHÈSE]**, **[INCONNU]** expriment le niveau de preuve ; « Terminé / Partiel / Cassé / Absent / À vérifier » décrit l’état.

| Fonctionnalité | Statut | Preuve / fichiers | Observations |
|---|---|---|---|
| Inscription, connexion, réinitialisation, profil, déconnexion | Terminé | `backend/src/controllers/authController.js`, `routes/authRoutes.js`; pages `frontend/src/pages/auth/` | Validation Zod, limiteurs dédiés et réponses anti-énumération décrits/tests présents. E-mail Supabase requis selon config distante : à confirmer. |
| Session frontend | Partiel | `frontend/src/context/AuthContext.jsx`, `services/authService.js`, `services/api.js` | Bearer token conservé dans `localStorage`; nettoyage réactif sur 401. Pas de rafraîchissement automatique documenté dans `PROGRESSION.md`. |
| Gestion des rôles | Terminé | `profiles`, `requireRole.js`, `adminController.js`, migrations 0001/0008/0011 | Rôles USER/ORGANIZER/ADMIN ; garde frontend utile pour UX, protection réelle serveur/DB. |
| Autorisations serveur | Terminé, sous réserve du déploiement DB | `backend/src/routes/adminRoutes.js`, `eventRoutes.js`, middlewares, migrations RLS | Les routes sensibles utilisent auth/rôle ; validation réelle des policies en Supabase distant non exécutée durant cet audit. |
| Demande organisateur | Partiel | `organizerRequestController.js`, `organizerDocumentValidator.js`, `dashboard/become-organizer.js`, migration 0001 | La candidature existe et empêche plusieurs demandes pending. Le texte `description` envoyé par l’UI n’est ni extrait par le validateur, ni enregistré par le contrôleur ; le schéma de migration ne fournit pas de champ correspondant. |
| Upload et accès aux justificatifs | Partiel | `organizerDocumentValidator.js`, `organizerRequestController.js`, migration 0009 | Vérification du chemin et existence, bucket privé, URLs signées côté API. Aucun upload UI/API ; l’écran admin affiche le chemin, pas le lien signé. |
| Approbation/refus candidature | Terminé côté API ; partiel côté examen documentaire UI | `adminRoutes.js`, `organizerRequestController.js`, RPC de 0002, page `admin/organizer-requests.js` | L’admin peut approuver/refuser et fournir un motif. Sans lien vers le document, l’examen visuel du justificatif depuis cette page manque. |
| Création/édition d’événements | Terminé selon code et tests présents | `eventController.js`, `eventRoutes.js`, validateurs, pages `organizer/events/` | Brouillon, modification et soumission ; validation des champs et invariants DB. Pas de test E2E navigateur exécuté. |
| Publication/modération événement | Terminé côté API/UI | routes admin, `eventController.js`, pages `admin/events-pending.js`, RPC SQL | Les événements approuvés sont publics ; les transitions sont encadrées par les RPC. |
| Recherche et détail public | Terminé côté implémentation | `eventQueryValidator.js`, `eventController.js`, page d’accueil/détail, RPC `get_public_event_detail` en migration 0011 | Filtres paginés et détail avec disponibilité ; tests correspondants existent. |
| Réservation et annulation | Partiel au niveau du parcours complet | `reservationController.js`, RPC `create_reservation`, `cancel_reservation`, migration 0011 | Réservation atomique `PENDING`, capacité protégée ; annulation transactionnelle. La confirmation dépend du flux de paiement sur place ou d’une intégration future. |
| Billets et QR code | Partiel / conditionnel | `ticketController.js`, `confirm_on_site_payment` SQL, `dashboard/tickets.js`, `qrcode.react` | Le ticket est produit lors de la confirmation sur place ; pas de billet réellement vérifié par un scanner/contrôle d’entrée identifié dans le dépôt. |
| Paiements réels (Stripe, PayPal, Mobile Money) | Absent | `backend/src/controllers/paymentController.js`, dépendances/package, `TASKS.md` B3 | Aucune passerelle, webhook ou preuve de capture réelle. Ne pas accepter `CARD` comme preuve de transaction. |
| Paiement sur place | Partiel | `paymentController.js`, `adminRoutes.js`, RPC `confirm_on_site_payment` | API d’intention/liste/confirmation présente ; interface admin de paiement manquante. |
| UI adaptée aux rôles | Terminé pour les espaces construits | `AuthContext.jsx`, `useRequireAuth.js`, `components/dashboard/Sidebar.jsx`, pages `admin/`, `organizer/` | Les restrictions UI ne remplacent pas les gardes serveur. |
| RLS, Storage et sécurité SQL | Partiel à confirmer sur l’instance | migrations 0001–0011, `sql-invariants-and-rls.test.js` | Les migrations définissent policies/RPC/invariants. Les tests locaux de SQL ne prouvent pas l’application en production ; pas de test contre instance isolée effectué ici. |
| Tests backend | Cassé dans l’environnement/local testé | `backend/package.json`, `backend/src/tests/` | Résultat réel : 104/108 passent après autorisation localhost ; 4 échecs CORS car les tests attendent `http://localhost:3001` alors que le frontend démarre sur 3333 et la configuration CORS chargée ne permet pas cette origine. Avant cette relance, les tests HTTP échouaient avec `EACCES` sandbox. |
| Lint frontend | Terminé avec avertissement | `frontend/package.json`; `frontend/src/components/events/EventCard.jsx:43` | `npm run lint` code retour 0, un warning sur `<img>`/Next Image, aucun error. |
| Build frontend | À vérifier | `npm run build` | Next 16.3.4 a commencé TypeScript et build optimisé, mais n’a affiché aucun résultat après attente prolongée ; processus interrompu. Ne pas le qualifier de réussi/échoué par le compilateur. |
| CI/CD | Absent | `git ls-tree` ne retourne pas de `.github`; commit de retrait `0527f05` | Les tests et le build Docker doivent être lancés manuellement. |
| Déploiement | À vérifier | `DEPLOYMENT.md`, `backend/Dockerfile`, `docker-compose.yml` | Procédure documentée ; aucun déploiement en ligne ou healthcheck de prod vérifié. Compose ne lance pas frontend ni base Postgres locale. |

## 6. Travail restant, priorisé P0/P1/P2

Les priorités ci-dessous sont des recommandations déduites des défauts et lacunes observés ; elles ne modifient pas les choix produit. Les critères servent à rendre chaque travail vérifiable.

### P0 — Fiabilité des tests avant toute livraison

1. **Rendre les tests CORS déterministes et les aligner au port frontend.** Problème : 4 tests attendent `localhost:3001`, alors que `frontend/package.json` lance Next sur 3333 et que la configuration réellement chargée les refuse. Fichiers : `backend/src/tests/cors-and-business-validators.test.js`, `health.test.js`, `security-headers.test.js`, configuration CORS de `backend/src/App.js`, `backend/.env.example`. Action : décider d’une origine de test dédiée injectée aux tests ou aligner attentes/config sans dépendre du `.env` local. Critère : `npm test` vert, depuis environnement propre et sans secrets, répétable. Dépendance : choix du port/origine standard de développement.
2. **Vérifier la migration complète en PostgreSQL isolé.** Le workflow qui faisait ce contrôle est retiré ; la doc Supabase est discordante. Fichiers : migrations 0001–0011, `backend/supabase/test-bootstrap.sql`, `schema-audit.md`. Action : rétablir un contrôle automatisé ou fournir un script reproductible pour appliquer les 11 migrations et contrôler tables/RPC/RLS sur DB jetable. Critère : application ordonnée avec `ON_ERROR_STOP=1`, vérification SQL des objets et résultat archivé. Dépendance : PostgreSQL local/CI ; ne jamais appliquer à la prod pour valider.

### P1 — Fermer les parcours fonctionnels indispensables

1. **Compléter le flux du justificatif organisateur.** Action : livrer un téléversement vers le bucket privé avec validation de taille/type et chemin contrôlé ; exposer à l’admin un lien signé cliquable seulement pour un utilisateur ADMIN ; remplacer le champ « déjà déposé » par le vrai parcours. Fichiers : `frontend/src/pages/dashboard/become-organizer.js`, services frontend, route/controller/validator backend, policies Storage en migration suivante. Critères : un USER ne peut déposer/lire que dans son dossier ; un admin autorisé peut ouvrir une URL temporaire ; un non-admin ne peut pas accéder au fichier ; tests couvrant fichiers invalides et accès interdits. Dépendance : limites de taille et types autorisés à confirmer.
2. **Décider et stocker la description de candidature.** L’UI l’exige et l’envoie, mais le backend et le schéma la perdent. Fichiers : `frontend/src/pages/dashboard/become-organizer.js`, `organizerDocumentValidator.js`, `organizerRequestController.js`, nouvelle migration SQL. Critères : la description est persistée et visible à l’admin, ou le champ est retiré après décision explicite ; validation serveur et test de bout en bout API. Dépendance : décision de conserver le champ et sa longueur maximale.
3. **Compléter et documenter le cycle de paiement sur place.** Il existe une confirmation API mais pas d’écran admin ; les réservations restent pending jusqu’à confirmation. Fichiers : `frontend/src/pages/admin/`, services admin, routes/controller paiement et RPC existantes. Critères : liste filtrée des `ON_SITE` pending, confirmation idempotente/contrôlée, billets activés une fois, affichage du résultat. Dépendance : valider que le paiement sur place fait partie du MVP.
4. **Décider le périmètre de paiement en ligne.** Stripe/PayPal/Mobile Money sont hors MVP dans `TASKS.md` ; ne pas brancher ces méthodes tant que fournisseur, pays, monnaie, remboursements, webhooks et politique de réservation expirée ne sont pas spécifiés. Critère d’avancement : décision fonctionnelle écrite, puis intégration seulement avec création serveur, validation de webhook, idempotence et tests sandbox.
5. **Confirmer l’exécution de `finish_expired_events()`.** La fonction SQL existe mais aucun cron/job n’est configuré dans le dépôt. Fichiers : migration 0011, configuration Supabase/hébergement hors dépôt. Critère : tâche planifiée documentée et démontrée en environnement de test ; sinon gérer explicitement les événements échus dans un flux confirmé.
6. **Établir la session frontend après expiration.** Le jeton est stocké en `localStorage` et supprimé sur 401 ; le suivi mentionne l’absence de rafraîchissement automatique. Fichiers : `AuthContext.jsx`, `authService.js`, `services/api.js`. Critère : comportement testé quand token expire, rôle change, session restaurée et logout ; choix de sécurité documenté. Évaluer le risque XSS du stockage local au regard du modèle de menace, sans le présenter comme une exploitation démontrée.

### P2 — Maintenabilité et livraison

1. **Réconcilier la documentation.** Mettre à jour `backend/supabase/README.md`, `README.md`, `TASKS.md`, `PROGRESSION.md` et `DEPLOYMENT.md` sur CI (retirée), total de tests, migrations, port 3333, état frontend, upload réel absent et paiement sur place incomplet. Critère : toutes les commandes et statuts concordent avec les fichiers actuels.
2. **Obtenir un build frontend reproductible.** Investiguer le build suspendu, refaire `npm run build` après résolution et enregistrer résultat/limite. Vérifier si le warning `<img>` mérite optimisation dans `EventCard.jsx:43`.
3. **Automatiser CI de façon contrôlée.** Quand le propriétaire le souhaite, ajouter pipeline backend tests, application migrations sur PostgreSQL jetable, lint et build frontend. Critère : workflow visible sur la branche et résultats sur pull request. Actuellement, aucune CI n’est active.
4. **E2E et déploiement.** Vérifier en environnement isolé les parcours USER/ORGANIZER/ADMIN, CORS de production, URL API, migrations déployées et healthcheck. Le dépôt n’a pas de test E2E navigateur ni de preuve d’URL de production.

## 7. Bugs, dette technique et risques de sécurité

### Défauts confirmés

- **Perte de la description candidature — [FAIT, bug fonctionnel].** `become-organizer.js` envoie `description`, mais `validateOrganizerRequestInput` ne la lit pas et `organizerRequestController.js` ne l’insère pas. La table `organizer_requests` de `0001_initial_schema.sql` n’a pas de colonne `description`. L’admin affiche donc « Aucune description ». Il faut décider d’une migration ou retirer le champ.
- **Justificatif impossible à téléverser depuis le produit — [FAIT, parcours incomplet].** L’UI demande le nom d’un fichier préexistant ; aucun upload n’est implémenté. Les policies Storage autorisent pourtant l’insertion de l’utilisateur dans son préfixe. Il faut faire correspondre l’interface à la capacité réelle et vérifier le contenu côté Storage, pas uniquement l’extension du nom.
- **Lien du justificatif non exploitable par l’admin — [FAIT, parcours incomplet].** L’API retourne `signed_document_url` pour les demandes, mais la page `admin/organizer-requests.js` affiche `document_path` en texte simple. L’administration ne peut pas consulter le document depuis cette page.
- **Échecs CORS des tests — [FAIT, constat de test].** Quatre assertions attendent `http://localhost:3001`; le script frontend écoute sur 3333. Suite exécutée après autorisation localhost : 104 réussites, 4 échecs (`health.test.js`, `security-headers.test.js`, `cors-and-business-validators.test.js`). Vérifier aussi la dépendance de la config aux variables locales dotenv afin que les tests ne soient pas influencés par le `.env` d’un développeur.
- **Documentation en contradiction avec le dépôt — [FAIT].** Aucun workflow CI suivi dans le HEAD ; le commit `0527f05` l’a supprimé. `PROGRESSION.md` conserve une ligne qui l’annonce actif et `backend/supabase/README.md` parle encore d’un workflow. `backend/supabase/README.md` décrit également un état de migrations incompatible avec les onze fichiers présents.
- **Build non conclu — [FAIT, vérification interrompue].** `npm run build` s’est arrêté après la phase TypeScript et le début de la compilation optimisée, sans résultat terminal. À reprendre dans un environnement stable.

### Contrôles présents et risques à distinguer

- **Auth/permissions : [FAIT, protections présentes].** `authMiddleware.js` valide le bearer token Supabase ; `requireRole.js` lit le profil et bloque en cas d’échec ; les routes admin exigent `ADMIN`. Supabase reçoit le JWT utilisateur au lieu d’un secret service-role global. Les policies RLS et fonctions `SECURITY DEFINER` sont versionnées. L’exécution des migrations et le comportement exact de l’instance déployée restent **[INCONNUS]**.
- **RLS/Storage : [FAIT côté fichiers, instance non vérifiée].** Le bucket est privé et les chemins sont vérifiés par préfixe utilisateur ; l’API produit une URL signée avec expiration d’une heure. Pas de vérification depuis un Supabase isolé effectuée dans cet audit. Ne pas traiter les tests statiques SQL comme une preuve d’autorisation réelle.
- **Validation / injection : [FAIT, mécanismes présents].** Le backend valide notamment les entrées d’auth, événements, filtres, réservations et justificatifs. Les filtres PostgREST sont échappés selon le suivi et les tests. Les requêtes visibles utilisent l’API Supabase plutôt que des concaténations SQL côté Node ; les RPC doivent rester auditées à chaque modification.
- **Limitation de débit et en-têtes : [FAIT, code présent].** `express-rate-limit`, Helmet, CORS à origine listée et limite de corps JSON existent dans `backend/src/App.js` et `authRoutes.js`. `TRUST_PROXY` n’est activé que par configuration ; en production, le nombre de proxies doit correspondre à l’infrastructure réelle.
- **Jeton navigateur : [HYPOTHÈSE de risque, pas vulnérabilité démontrée].** Le token est dans `localStorage`, donc une faille XSS pourrait l’exposer. Aucune injection XSS exploitable n’a été démontrée dans cette revue ; considérer cela comme un point de modèle de menace, non comme une compromission constatée.
- **Concurrence de réservation : [FAIT, protection présente dans la fonction].** `create_reservation` verrouille la ligne événement (`FOR UPDATE`) et calcule les quantités pending/confirmed avant insertion. La vraie concurrence DB n’a pas été testée ici contre PostgreSQL/Supabase.
- **Événements échus : [FAIT, dépendance opérationnelle ouverte].** `finish_expired_events()` est révoquée à `PUBLIC`, `anon`, `authenticated` et commentée comme destinée à un cron/job privilégié. Aucun cron ne figure dans ce dépôt. Sans tâche externe, les événements approuvés échus peuvent ne pas être réétiquetés `FINISHED`, même si le catalogue et la réservation filtrent leur date.
- **Gestion d’erreurs : [FAIT, à surveiller].** L’API a un handler Express central ; plusieurs contrôleurs convertissent les erreurs Supabase en erreurs génériques. Les réponses SQL RPC peuvent parfois renvoyer le message d’erreur brut au demandeur, par exemple confirmation de paiement (`paymentController.js`) : vérifier que les messages ne divulguent pas de détails sensibles.
- **Identifiants `bigint` : [FAIT, validation mixte].** Les validateurs d’événement/réservation utilisent `Number.isSafeInteger` selon le backlog et le code de validation ; `createPayment` convertit encore l’ID via `Number` et `Number.isInteger`. Examiner la cohérence si les identifiants dépassent la précision sûre de JS.
- **Secrets : [FAIT, précaution].** `.env.example` ne contient que des placeholders ; le vrai `.env` local n’a pas été imprimé ni copié dans ce document. La clé publishable Supabase n’est pas une clé service-role. Ne jamais transmettre les fichiers `.env` ni leurs valeurs à Gemini.
- **Migrations : [FAIT, limitation].** Les fichiers sont ordonnés 0001–0011 et ne sont pas lancés automatiquement par Compose. La doc Supabase demande prudence avec les migrations initiales sur le projet existant ; confirmer le schéma distant avant toute application. L’audit n’a pas appliqué ces fichiers.
- **Dépendances : [FAIT, à vérifier avant prod].** Les manifests et lockfiles sont présents. Aucun audit `npm audit` ni vérification de versions distantes n’a été demandé/exécuté ; la dépendance Stripe est déclarée sans intégration effective.

## 8. Installation, environnement et commandes

### Prérequis observés

- Node.js compatible avec le projet ; conteneur backend basé sur Node 24. npm et accès aux dépendances nécessaires.
- Projet Supabase configuré avec tables, fonctions et policies correspondant aux migrations. Pas de PostgreSQL local lancé par le Compose actuel.
- Docker Desktop si l’on veut démarrer le backend conteneurisé.

### Variables d’environnement backend

Les noms réels présents dans `backend/.env.example` et `DEPLOYMENT.md` :

| Variable | Utilité | Obligatoire/condition |
|---|---|---|
| `PORT` | port Express | défaut applicatif 3000 |
| `NODE_ENV` | mode runtime, logs et règle CORS | production interdit l’origine wildcard |
| `TRUST_PROXY` | fait confiance à un saut proxy | mettre `1` uniquement derrière un proxy de confiance correspondant |
| `FRONTEND_URL` | liste d’origines CORS séparées par virgules | local doit correspondre au port frontend ; prod URL exacte(s) |
| `SUPABASE_URL` | URL du projet Supabase | requis par `config/supabase.js` |
| `SUPABASE_PUBLISHABLE_KEY` | clé publishable/anon Supabase | requis ; ne pas remplacer par une service-role dans le frontend |
| `PASSWORD_RESET_REDIRECT_URL` | URL de redirection du reset | doit être autorisée dans les réglages Supabase |

Le frontend utilise un service API configuré par `NEXT_PUBLIC_API_URL` (à définir pour joindre le backend ; vérifier sa valeur par défaut dans `frontend/src/services/api.js` avant déploiement). Ne placer aucun secret dans une variable `NEXT_PUBLIC_*`.

### Commandes exactes trouvées

Backend, depuis `backend/` :

```powershell
npm install
Copy-Item .env.example .env
npm run dev
npm start
npm test
npm run test:unit
npm run test:http
```

Frontend, depuis `frontend/` :

```powershell
npm install
npm run dev       # Next dev sur le port 3333
npm run lint
npm run build
npm start
```

Docker, depuis la racine, après création/configuration locale de `backend/.env` :

```powershell
docker compose up --build
```

Le service backend expose `3000:3000`; healthcheck HTTP applicatif : `GET http://localhost:3000/api/health`. Frontend de développement : `http://localhost:3333`.

### Migrations et contrôles

Les migrations présentes sont `backend/supabase/migrations/0001_initial_schema.sql` à `0011_event_lifecycle_and_public_details.sql`. Aucun script npm d’application n’est déclaré et Compose ne lance pas PostgreSQL ni Supabase. `backend/supabase/README.md` indique l’utilisation d’un projet Supabase séparé/jetable pour tester les migrations initiales ; vérifier ce guide et la divergence de ses passages anciens avant d’exécuter les migrations. **Ne pas rejouer 0001/0002 sur une base existante.** Utiliser Supabase CLI/PostgreSQL selon l’environnement réellement provisionné et appliquer les migrations dans l’ordre sur une base jetable avant la production.

Vérifications réellement tentées lors de cet audit :

- `backend: npm test` dans le bac à sable : tests HTTP bloqués par `EACCES` sur `127.0.0.1`.
- `backend: npm test` après autorisation d’ouvrir localhost : **104/108 passent, 4 échouent** sur CORS (`localhost:3001` attendu par les tests mais non autorisé dans la configuration chargée).
- `frontend: npm run lint` : code retour 0, 1 warning `<img>`.
- `frontend: npm run build` : TypeScript achevé et compilation optimisée commencée ; commande interrompue après attente sans résultat. Build non validé.
- Aucun test contre Supabase/PostgreSQL, aucune migration, aucun Docker build ni déploiement en ligne n’a été exécuté.

## 9. Conventions de développement

### Conventions observées

- Backend CommonJS (`require`, `module.exports`) ; frontend ES modules/JSX avec alias `@/` (défini dans `frontend/jsconfig.json`).
- Backend organisé par domaine : routes → middlewares → controllers → client Supabase/RPC ; validateurs isolés dans `src/validators/`.
- Les routes protégées installent `requireAuth`; les opérations admin/organizer appliquent `requireRole` côté serveur.
- Les validations sont testées via Vitest ; les tests HTTP utilisent Supertest. Scripts officiels : `test`, `test:unit`, `test:http` dans `backend/package.json`.
- Les changements DB doivent être une nouvelle migration séquentielle ; ne pas réécrire une migration partagée sans décision explicite. Les scripts SQL d’inspection sont dans `backend/supabase/`.
- Les appels frontend passent par les services (`authService`, `eventService`, `reservationService`, `adminService`, `ticketService`) et `api.js` centralise fetch/token/erreurs.
- Le lint ESLint frontend est configuré. Aucune convention de commit actuelle suffisamment formelle n’est spécifiée ; l’historique utilise des préfixes de type `feat`, `fix`, `docs`, `ci`, mais cela ne constitue pas une règle documentée complète.
- Le dépôt contient `AGENTS.md` : toute modification exige un plan détaillé préalable et un accord explicite ; après chaque étape validée et chaque push, synchroniser `PROGRESSION.md` et `TASKS.md`. Respecter aussi `frontend/AGENTS.md` : Next.js 16 a des changements spécifiques ; lire la documentation locale Next sous `frontend/node_modules/next/dist/docs/` avant d’éditer du code frontend.

### Recommandations (pas des conventions existantes)

- Rendre le test et les builds reproductibles en environnement propre et consigner les versions/résultats réels.
- Toute nouvelle RPC `SECURITY DEFINER` doit avoir un `search_path` sûr, des permissions d’exécution minimales et des tests de rôles/RLS.
- Ne pas présenter un formulaire UI ou un endpoint comme une fonctionnalité opérationnelle sans tester l’aller-retour réel, les autorisations et les erreurs.
- Garder les docs synchronisées avec le code ; identifier explicitement les faits constatés vs les affirmations sur l’environnement distant.

## 10. Plan d’action ordonné pour Gemini

1. **Prendre connaissance sans modifier** : lire `AGENTS.md`, `frontend/AGENTS.md`, `README.md`, `TASKS.md`, `PROGRESSION.md`, `CODE_REVIEW_ACTION_PLAN.md`, `DEPLOYMENT.md`, les deux `package.json` et les migrations 0001–0011. Vérifier le statut Git et ne pas écraser les changements du propriétaire.
2. **Démarrer les services localement** : vérifier Node/npm, variables sans afficher les secrets ; configurer Supabase de test ; installer frontend/backend ; lancer `npm run dev` depuis backend et frontend. Vérifier `/api/health` et le catalogue public. Ne pas présumer que Docker lance le frontend ou PostgreSQL.
3. **Rendre les validations fiables (P0)** : stabiliser les origines CORS de tests contre le port 3333 ou une origine dédiée explicitement fixée. Relancer toute la suite backend dans un environnement autorisant localhost ; objectif `npm test` totalement vert. Vérifier les migrations sur PostgreSQL/Supabase jetable, pas sur le projet de production.
4. **Clarifier le dossier organisateur (P1)** : examiner `become-organizer.js`, `organizerDocumentValidator.js`, `organizerRequestController.js`, la migration de table et les policies Storage. Demander si la description de structure doit être conservée et préciser les limites de fichier ; implémenter le vrai upload et l’accès admin signé seulement après ces décisions. Valider les cas USER/admin, refus d’accès et expiration du lien.
5. **Compléter le parcours de réservation (P1)** : lire contrôleurs réservation/paiement/ticket et RPC `create_reservation`, `create_payment_for_reservation`, `confirm_on_site_payment`, `cancel_reservation`, `cancel_event`. Décider si paiement sur place appartient au MVP ; si oui, construire la page admin manquante et tester l’idempotence ainsi que la génération unique de billets. Ne pas traiter les méthodes CARD/PayPal/Mobile Money comme opérationnelles.
6. **Confirmer les règles du cycle de vie** : préciser quand et par qui les organisateurs sont rétrogradés, les cas multi-événements et le sort des événements terminés. Vérifier l’existence réelle d’un cron pour `finish_expired_events`; ajouter la configuration documentée seulement après validation de l’hébergement.
7. **Prouver la livraison frontend** : diagnostiquer et relancer `npm run build`, puis effectuer un parcours E2E du catalogue, auth, réservation, billets, espaces de rôle. Configurer `NEXT_PUBLIC_API_URL`, les origines CORS et les URLs de reset selon les hôtes réellement retenus.
8. **Réconcilier les documents et la CI (P2)** : corriger les mentions obsolètes de CI/migrations/tests/état frontend ; éventuellement réintroduire une CI qui lance tests backend, migrations jetables, lint/build frontend et Docker build. Ne pas prétendre qu’un workflow est actif avant qu’il soit suivi dans Git et exécuté.
9. **Avant toute livraison** : revue de sécurité des changements SQL, test des rôles et de RLS avec vraies identités de test, résultat de build/test consigné, vérification manuelle des CORS, test healthcheck sur un environnement staging et confirmation des migrations appliquées.

### Questions ouvertes à poser au propriétaire

1. Quel est le périmètre du MVP : réservation avec paiement sur place, ou paiement en ligne également ? Quels moyens/fournisseurs, pays et monnaies sont réellement nécessaires ?
2. Le champ de description de la candidature organisateur doit-il être persisté et présenté à l’administrateur ?
3. Quels formats, taille maximale, durée de conservation et règles de suppression s’appliquent aux justificatifs ? Qui peut les télécharger et combien de temps les URLs signées doivent-elles vivre ?
4. L’accès ORGANIZER est-il permanent après approbation, révoqué manuellement, ou conditionné aux événements actifs ? Que faire lorsqu’un compte gère plusieurs événements ?
5. Quel mécanisme d’hébergement/cron doit exécuter `finish_expired_events()` ?
6. Quelle origine locale standard choisir : port Next 3333 (script actuel) ou 3001 (attendu par plusieurs tests) ? Quelles URL de frontend/API sont celles du déploiement cible ?
7. Les migrations 0001–0011 ont-elles été appliquées à l’instance Supabase réelle ? Existe-t-il un environnement staging et une procédure de sauvegarde/rollback ?
8. Le workflow CI avait-il été volontairement retiré définitivement, ou faut-il le réintroduire après correction des tests ?

### Résumé exécutif (5 lignes)

MyTicket est une application Next.js/React reliée à une API Express et Supabase/PostgreSQL, avec rôles USER, ORGANIZER et ADMIN.
Le cœur événements, modération, réservation, sécurité serveur/RLS et création de billets sur confirmation est présent ; le paiement PSP réel est absent.
Le dépôt ne fournit pas d’upload frontend du justificatif, n’enregistre pas la description de candidature et n’affiche pas le lien signé à l’admin.
La CI est retirée ; la suite backend observée échoue sur 4 tests CORS sur 108, le lint passe avec un avertissement et le build frontend reste à vérifier.
Confirmer migrations distantes, cron, règles métier organisateur/paiement et environnement de déploiement avant toute mise en production.
