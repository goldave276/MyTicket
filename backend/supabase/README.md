# Migrations Supabase

Ce dossier contient les migrations PostgreSQL du projet MyTicket.

## Regle importante

Une migration est un fichier SQL versionne dans Git. Elle decrit une evolution de la base : table, contrainte, index, fonction RPC ou politique RLS.

Ne pas recopier manuellement une requete SQL dans plusieurs endroits. Une evolution doit etre ajoutee dans un nouveau fichier, par exemple :

```text
supabase/migrations/202609060001_add_event_indexes.sql
```

Les migrations doivent etre appliquees dans l'ordre et ne doivent pas modifier les anciennes migrations deja partagees.

## Etat actuel

La base Supabase a ete construite dans le SQL Editor avant la mise en place de ce dossier. Le schema existant doit donc etre exporte ou recopie avec precaution avant de creer la migration initiale.

Cette etape est volontairement separee du code applicatif : une migration initiale incomplete serait plus dangereuse qu'une documentation claire.

## Procedure pour la migration initiale

1. Executer `supabase/inspect-schema.sql` dans le SQL Editor Supabase.
2. Executer `supabase/inspect-rpc-and-triggers.sql` pour obtenir les signatures RPC, triggers et relations.
3. Recuperer aussi les index et les extensions activees si le projet en utilise.
4. Exporter le schema actuel, y compris les tables, fonctions RPC, index, triggers et politiques RLS.
5. Le placer dans un fichier `0001_initial_schema.sql`.
6. Tester la migration sur un projet Supabase de test.
7. Comparer les tables et les permissions avec le projet actuel.
8. Seulement ensuite, utiliser ce fichier comme base de travail partagee.

## Consequence pour le backend

Les controleurs Node.js appellent notamment les fonctions RPC de reservation, d'approbation et d'annulation. Ces fonctions font partie du contrat backend et doivent donc etre versionnees avec la base, pas seulement conservees dans l'historique du SQL Editor.
