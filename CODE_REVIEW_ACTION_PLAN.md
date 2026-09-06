# Plan d'action issu de la revue senior

**Date :** 06/09/2026  
**Périmètre :** backend Express, migrations Supabase, configuration et couverture de tests.  
**Exclusion explicite :** le module `payments` (passerelles, statuts, webhooks, doublons, annulation et interactions avec les paiements) est volontairement hors périmètre. Aucune instruction de ce document ne doit modifier ce module ni ses migrations métier.

## Objectif et ordre de travail

Le travail doit être découpé en petites pull requests ou commits indépendants. Pour chaque étape : créer les tests qui reproduisent le défaut, appliquer la correction minimale, lancer les vérifications indiquées, puis seulement passer à l'étape suivante.

Ordre obligatoire :

1. Validation du catalogue public et correction du test rouge.
2. Sécurité d'authentification et limitation de débit.
3. Protection du lien entre Storage et demandes organisateur.
4. Configuration CORS et traitement d'erreurs HTTP.
5. Qualité des tests et mise à jour documentaire.
6. Frontend, qui constitue un chantier séparé et non une simple correction.

---

## A1 — Valider tous les filtres du catalogue public

**Gravité : élevée — endpoint concerné :** `GET /api/events/approved`  
**Fichier actuel :** `backend/src/controllers/eventController.js`, lignes 284 à 307.  
**Constat :** `minPrice` et `maxPrice` sont convertis avec `Number(...)` sans vérifier le résultat. Les dates et la relation entre les bornes ne sont pas contrôlées. Une valeur comme `minPrice=notanumber` part vers Supabase ; le test actuel dépasse son délai de cinq secondes.

### Implémentation précise

1. Créer un validateur pur, par exemple `backend/src/validators/eventQueryValidator.js`. Ne pas mettre cette logique dans le contrôleur afin de la tester sans appel HTTP ni Supabase.
2. Accepter uniquement ces clés : `search`, `eventType`, `location`, `dateFrom`, `dateTo`, `minPrice`, `maxPrice`, `page`, `limit`. Ignorer ou rejeter explicitement toute autre clé ; choisir un comportement et le documenter dans le contrat API.
3. Pour `search`, `eventType` et `location` : exiger une chaîne, appeler `trim()`, transformer une chaîne vide en valeur absente, et imposer une taille maximale. Recommandation : 100 caractères pour `search`, 80 pour `eventType`, 120 pour `location`.
4. Pour `minPrice` et `maxPrice` : n'accepter que des représentations décimales non négatives finies. Refuser `NaN`, `Infinity`, une chaîne vide, un objet, un tableau et un nombre négatif. Convertir une seule fois, puis conserver le nombre validé.
5. Si les deux prix existent, refuser la requête lorsque `minPrice > maxPrice`.
6. Pour `dateFrom` et `dateTo` : accepter exclusivement une date ISO-8601 complète avec fuseau (`YYYY-MM-DDTHH:mm:ss.sssZ` ou équivalent), construire un `Date`, puis vérifier que `getTime()` est fini. Ne jamais transmettre une date invalide à Supabase.
7. Si les deux dates existent, refuser la requête lorsque `dateFrom > dateTo`.
8. Ajouter `page` et `limit` pour empêcher la lecture intégrale du catalogue. Valeurs recommandées : `page >= 1`, `1 <= limit <= 50`, valeurs par défaut `page=1`, `limit=20`.
9. Dans `getApprovedEvents`, appeler le validateur avant `supabase.from(...)`. En cas d'erreur, retourner `400` avec un message stable et une structure exploitable, par exemple `{ "message": "Filtres invalides", "errors": { "minPrice": "..." } }`.
10. Après validation, utiliser les valeurs normalisées. Ajouter `.range((page - 1) * limit, page * limit - 1)` et retourner les métadonnées de pagination si la requête utilise `count: "exact"`.

### Sécuriser la syntaxe PostgREST

La ligne utilisant `.or(...)` concatène directement `search`. Construire un échappement dédié aux caractères significatifs de la syntaxe PostgREST (au minimum virgule, parenthèses, point et pourcentage selon le format retenu), ou remplacer l'OR texte par une RPC PostgreSQL paramétrée. Ne pas interpoler une donnée brute dans une expression de filtre.

### Tests obligatoires

Ajouter un fichier unitaire du validateur et compléter `backend/src/tests/edge-cases.test.js` avec :

- `minPrice=notanumber`, `maxPrice=invalid`, chaîne vide et nombre négatif : réponse 400 immédiate ;
- `minPrice > maxPrice` : réponse 400 ;
- date invalide et plage de dates inversée : réponse 400 ;
- recherche contenant des caractères de syntaxe PostgREST : aucun changement de structure de requête ;
- `page=0`, `limit=51`, `limit=abc` : réponse 400 ;
- cas nominal paginé : paramètres normalisés et ordre chronologique conservé.

**Critère de sortie :** `npm test` termine sans timeout et les filtres invalides n'initialisent aucune requête Supabase.

---

## A2 — Faire échouer l'authentification si le statut de blocage est inconnu

**Gravité : moyenne/élevée — fichier :** `backend/src/middlewares/authMiddleware.js`, lignes 32 à 40.  
**Constat :** l'erreur de lecture de `profiles.is_blocked` est ignorée. Un compte bloqué peut être traité comme valide si ce contrôle échoue.

### Implémentation précise

1. Récupérer `error` en même temps que `data: profile` lors de la requête `profiles`.
2. Si `error` est présent, répondre `503` avec un message générique, par exemple `Verification du compte indisponible`, puis faire `return`. Ne jamais exécuter `next()` dans ce cas.
3. Si `profile` est absent, répondre `403` ou `401` selon le contrat retenu ; recommandation : `403` avec `Profil utilisateur introuvable`, car le jeton reste techniquement valide mais le compte applicatif est incomplet.
4. Conserver le `403 Compte bloque` lorsque `profile.is_blocked === true`.
5. Entourer l'appel externe `supabase.auth.getUser(token)` et la requête profil d'un `try/catch` si nécessaire pour garantir une réponse JSON contrôlée lors d'une erreur réseau. Express 5 relaie les promesses rejetées, mais un middleware doit conserver un comportement explicite.

### Tests obligatoires

- profil `{ is_blocked: true }` : 403, `next` jamais appelé ;
- erreur Supabase lors de la lecture de profil : 503, `next` jamais appelé ;
- profil absent : code choisi documenté, `next` jamais appelé ;
- profil non bloqué : `next` appelé exactement une fois.

**Critère de sortie :** aucune erreur de vérification de blocage ne donne accès aux routes protégées.

---

## A3 — Lier strictement le justificatif Storage à son propriétaire

**Gravité : moyenne — fichiers :** `backend/src/controllers/organizerRequestController.js`, lignes 1 à 23 ; `backend/supabase/migrations/0009_performance_indexes.sql`, lignes 38 à 65.  
**Constat :** Storage restreint l'upload au dossier `<auth.uid()>/...`, mais l'API accepte n'importe quel `documentPath` dans une demande organisateur. La base peut donc référencer un fichier qui n'est pas celui déposé par le demandeur.

### Implémentation précise

1. Fixer le format officiel de `documentPath` : `<user_uuid>/<nom-fichier>`, sans préfixe de bucket ni URL complète.
2. Dans `createOrganizerRequest`, construire le préfixe autorisé avec `const expectedPrefix = `${req.user.id}/`;`.
3. Rejeter avec 400 un chemin qui : ne commence pas par ce préfixe exact, ne contient pas de nom de fichier après le préfixe, contient `..`, commence par `/`, contient `\\`, ou dépasse une longueur raisonnable (recommandation : 500 caractères).
4. Ne jamais accepter une URL signée, une URL publique, une URL Supabase complète ou un nom de bucket dans ce champ. Ces valeurs doivent être générées côté serveur au moment de consulter le fichier, pas stockées comme preuve d'autorisation.
5. Ajouter une fonction dédiée de validation, par exemple `backend/src/validators/organizerDocumentValidator.js`, testée séparément.
6. Avant l'insertion, vérifier l'existence du fichier dans le bucket `organizer-documents` avec un client authentifié, si l'API est le point d'entrée de la demande. Si l'architecture choisie est upload direct Supabase puis API, effectuer au minimum cette vérification d'existence et traiter 404/erreur réseau proprement.
7. Pour la consultation côté administrateur, produire une URL signée de courte durée à partir du chemin stocké. Ne pas modifier les politiques Storage existantes sans test sur Supabase de test.

### Tests obligatoires

- chemin appartenant au demandeur : accepté ;
- UUID d'un autre utilisateur : 400 ;
- `../`, `/uuid/fichier`, URL complète, chemin vide, fichier manquant : 400 ;
- fichier absent du bucket : erreur contrôlée, aucune demande créée ;
- admin : seule une URL signée temporaire est exposée, jamais un bucket public.

**Critère de sortie :** une demande organisateur ne peut désigner qu'un fichier privé appartenant à son créateur.

---

## A4 — Limiter les endpoints d'authentification exposés aux abus

**Gravité : moyenne — fichiers :** `backend/src/routes/authRoutes.js` et `backend/src/controllers/authController.js`.  
**Constat :** seul `/login` est limité à 10 requêtes par 15 minutes. L'inscription et la réinitialisation de mot de passe restent sans protection contre spam, énumération et saturation du fournisseur Auth.

### Implémentation précise

1. Définir des limiteurs distincts dans `authRoutes.js` :
   - `signupLimiter` : recommandation 5 requêtes / heure / IP ;
   - `passwordResetLimiter` : recommandation 5 requêtes / heure / IP.
2. Activer `standardHeaders` et désactiver `legacyHeaders`, comme pour le login.
3. Ajouter un `keyGenerator` sûr seulement si un identifiant normalisé est nécessaire. Ne jamais utiliser l'e-mail brut comme unique clé sans considérer les proxys, NAT et données personnelles. L'IP est un minimum acceptable pour le MVP.
4. Vérifier la configuration proxy (`app.set('trust proxy', ...)`) avant un déploiement derrière Render/Railway/Vercel proxy ; sinon le rate limiting peut utiliser une IP erronée. Documenter la valeur correspondant à l'hébergeur choisi.
5. Valider le format et les bornes de l'e-mail avant l'appel Supabase : chaîne, trim, longueur maximale 254, syntaxe raisonnable. Refuser également les mots de passe hors politique locale minimale avant l'appel distant.
6. Pour la réinitialisation, conserver une réponse publique uniforme : ne pas renvoyer l'erreur brute de Supabase pour les cas d'e-mail inexistant ou de limitation fournisseur.

### Tests obligatoires

- dépassement de chaque limite : 429 et message attendu ;
- e-mail non valide : 400 sans appel Supabase ;
- même réponse externe pour adresse inconnue et adresse existante lorsque Supabase le permet ;
- tests isolés : réinitialiser le store de rate limit entre tests ou l'injecter, afin qu'un test ne contamine pas le suivant.

**Critère de sortie :** chaque endpoint d'authentification public est borné et n'expose pas de détails inutiles sur les comptes.

---

## A5 — Durcir CORS et rendre les erreurs CORS cohérentes

**Gravité : moyenne — fichier :** `backend/src/App.js`, lignes 25 à 39 et 76 à 83.  
**Constat :** la valeur spéciale `*` est acceptée alors que l'application utilise `credentials: true`. Une origine refusée remonte comme erreur générique et devient vraisemblablement une réponse 500.

### Implémentation précise

1. Au démarrage, construire `allowedOrigins` en supprimant les entrées vides et en validant chaque URL avec `new URL(origin)`.
2. En production, interdire explicitement `*`. Si `NODE_ENV === "production"` et que `FRONTEND_URL` contient `*`, arrêter le processus avec une erreur de configuration claire.
3. En développement, si une ouverture CORS totale est indispensable, désactiver `credentials` pour ce mode ; ne jamais combiner wildcard et identifiants.
4. Dans le callback CORS, créer une erreur portant un code stable, par exemple `err.code = "CORS_ORIGIN_DENIED"`.
5. Dans le middleware global d'erreur, reconnaître ce code et renvoyer `403` avec `{ message: "Origine non autorisee" }`. Ne pas loguer le jeton Authorization ni le corps de requête.
6. Ajouter le header `Vary: Origin` si le middleware CORS ne le fait pas déjà, pour éviter un cache partagé incorrect.
7. Ajouter les domaines de production exacts dans `.env.example`, sans slash final et sans wildcard.

### Tests obligatoires

- origine déclarée : 200 et `access-control-allow-origin` égal à l'origine ;
- origine non déclarée : 403 JSON, pas 500 ;
- pré-vol `OPTIONS` autorisé : réponse CORS attendue ;
- démarrage production avec `FRONTEND_URL=*` : échec contrôlé ;
- requête sans header `Origin` (healthcheck, curl serveur) : comportement explicitement conservé ou refusé selon le contrat choisi.

**Critère de sortie :** les navigateurs autorisés fonctionnent, les autres obtiennent 403 et une configuration dangereuse est impossible en production.

---

## A6 — Compléter les validations de données métier hors paiement

**Gravité : moyenne — fichiers :** `backend/src/controllers/eventController.js`, `authController.js`, `organizerRequestController.js`, `reservationController.js`.  
**Constat :** les contrôleurs valident certains types, mais aucune politique homogène de longueur, normalisation et forme n'est appliquée.

### Implémentation précise

1. Choisir une seule bibliothèque de schémas déjà présente dans le projet : `zod`. Créer un répertoire `backend/src/validators/`.
2. Définir un schéma pour la création/modification d'événement :
   - `title` : chaîne trimée, 3 à 150 caractères ;
   - `description` : chaîne trimée, 10 à 5 000 caractères ;
   - `eventType` : 2 à 80 caractères ;
   - `location` : 2 à 200 caractères ;
   - `eventDate` : date ISO future ;
   - `capacity` : entier strict positif, plafond métier à décider (ex. 100 000) ;
   - `price` : décimal non négatif, précision monétaire décidée et documentée.
3. Employer le même schéma pour `createEvent` et `updateEvent`. L'API doit soit accepter uniquement le remplacement complet actuel, soit exposer un PATCH réellement partiel ; ne pas annoncer PATCH puis exiger tous les champs sans le documenter.
4. Définir les schémas pour identifiants `bigint` d'URL et corps de requête. Refuser `1.5`, zéro, signe négatif, notation exponentielle et valeurs dépassant la plage sûre JavaScript avant conversion en `Number`.
5. Pour les UUID utilisateur, utiliser un validateur UUID exact plutôt qu'une expression régulière permissive ; la validation doit être identique dans tous les contrôleurs administratifs.
6. Centraliser la conversion des erreurs Zod en réponse 400, sans exposer la pile ni les détails internes de Supabase.

### Tests obligatoires

- limites minimale et maximale de chaque texte ;
- capacité/prix aux frontières ;
- ID hors plage sûre, décimal ou malformé ;
- création et édition retournent exactement le même format d'erreur pour une même donnée invalide.

**Critère de sortie :** chaque entrée HTTP non triviale est validée une seule fois, avec les mêmes règles dans toutes les routes concernées.

---

## A7 — Rendre les tests utiles et réellement isolés

**Gravité : moyenne — fichiers :** `backend/src/tests/` et `backend/vitest.config.mjs`.  
**Constat :** une partie importante des tests appelle des contrôleurs avec des mocks qui contrôlent eux-mêmes la réponse attendue. La suite contient un timeout réel et ne vérifie ni RLS, ni les fonctions RPC, ni la concurrence de réservation.

### Implémentation précise

1. Corriger d'abord `edge-cases.test.js` en testant les filtres invalides sans dépendre d'une requête réseau réelle.
2. Séparer les suites en trois catégories nommées :
   - `unit` : validateurs et contrôleurs avec dépendances mockées ;
   - `http` : Express/Supertest, auth et CORS ;
   - `integration` : Supabase local ou projet de test dédié.
3. Ajouter un environnement de test explicitement isolé. Ne jamais laisser une suite appeler le projet Supabase de développement personnel avec de vraies données.
4. Pour l'intégration, appliquer les migrations dans l'ordre, créer des utilisateurs de test et vérifier : RLS utilisateur, rôle organisateur, rôle admin, visibilité des événements, unicité de demande organisateur et refus de modification d'un événement non modifiable.
5. Ajouter un test concurrent de réservation : deux transactions tentent de prendre les dernières places ; une seule doit réussir. Ce test valide le verrou `FOR UPDATE` de la RPC.
6. Réinitialiser les données de test après chaque fichier ou utiliser une base éphémère par pipeline.
7. Configurer une durée maximale réaliste et échouer rapidement en cas d'appel réseau non mocké dans les tests unitaires.
8. Ajouter `npm run test:unit`, `npm run test:http`, `npm run test:integration` et faire exécuter au moins unit + http en CI à chaque push.

### Critère de sortie

La commande `npm test` est déterministe, sans accès involontaire au réseau, et l'intégration vérifie les règles qui vivent réellement en SQL/RLS.

---

## A8 — Mettre le frontend au niveau du contrat backend

**Gravité : produit / livraison — fichiers :** `frontend/src/pages/index.js`, `frontend/README.md`.  
**Constat :** le frontend est le template Next.js initial. Aucune interface métier ne consomme l'API, alors que la documentation du projet décrit des parcours complets.

### Implémentation précise

1. Avant toute page métier, installer les dépendances du frontend avec le lockfile et faire passer `npm run lint` puis `npm run build`.
2. Créer un client API unique avec `NEXT_PUBLIC_API_URL`, ajout du bearer token, traitement 401 et fonctions typées/documentées par endpoint.
3. Implémenter dans cet ordre : catalogue public, authentification, profil, réservations, espace organisateur, espace administrateur.
4. Ne pas afficher de bouton ou parcours relatif à un paiement tant que ce chantier est explicitement reporté. Les interfaces doivent dire que cette capacité n'est pas disponible si le produit expose déjà une réservation concernée.
5. Pour les rôles, lire le profil depuis `GET /api/auth/me` après chaque connexion ; ne jamais décider d'une permission uniquement dans le navigateur.
6. Ajouter des tests de composants et un parcours E2E minimal : inscription/connexion simulée, catalogue, accès refusé aux pages de rôle non autorisé.
7. Réécrire `frontend/README.md`, qui est encore celui de `create-next-app`, afin qu'il corresponde au produit et aux scripts réellement disponibles.

**Critère de sortie :** le frontend ne se présente plus comme une application livrée tant qu'il ne propose pas au moins le catalogue, l'authentification et les parcours API correspondants.

---

## A9 — Mettre à jour le contrat et les documents après chaque correction

**Gravité : maintenance — fichiers :** `README.md`, `TASKS.md`, `PROGRESSION.md`, `DEPLOYMENT.md`, `.env.example`.  
**Constat :** la documentation affirme que le MVP backend est validé et que les tests sont exhaustifs, alors que la suite actuelle échoue et que le frontend est un template.

### Instructions précises

1. Après chaque correction, inscrire dans `PROGRESSION.md` : date, objectif, fichiers modifiés, commande de vérification et résultat.
2. Dans `TASKS.md`, ne cocher une tâche que si son critère de sortie est démontré par une commande ou un test ajouté.
3. Mettre à jour le contrat API dans `README.md` dès qu'une validation, une pagination ou un format d'erreur change.
4. Dans `DEPLOYMENT.md`, indiquer les variables CORS exactes et la stratégie `trust proxy` choisie.
5. Remplacer les affirmations « validé » ou « exhaustif » par l'état mesurable réel tant que les tests sont rouges.

**Critère de sortie :** la documentation permet à un nouveau développeur de démarrer, tester et déployer sans supposer des fonctionnalités inexistantes.

## Vérification finale avant clôture du chantier

- `backend`: `npm test` vert ;
- `backend`: tests d'intégration RLS/RPC verts dans un environnement isolé ;
- `frontend`: `npm run lint` et `npm run build` verts après installation des dépendances ;
- revue manuelle des réponses CORS et des routes d'authentification ;
- aucune modification apportée au module de paiements, conformément au périmètre explicitement exclu ;
- `TASKS.md` et `PROGRESSION.md` synchronisés avec les résultats réellement obtenus.
