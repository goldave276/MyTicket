# Migrations Supabase

Ce dossier contient les migrations PostgreSQL du projet MyTicket.

## Regle importante

Une migration est un fichier SQL versionne dans Git. Elle decrit une evolution de la base : table, contrainte, index, fonction RPC ou politique RLS.

Ne pas recopier manuellement une requete SQL dans plusieurs endroits. Une evolution doit etre ajoutee dans un nouveau fichier, par exemple :

```text
supabase/migrations/202609060001_add_event_indexes.sql
```

Les migrations doivent etre appliquees dans l'ordre et ne doivent pas modifier les anciennes migrations deja partagees.

## Migrations disponibles

Le dossier `migrations/` contient l'ensemble ordonne des migrations PostgreSQL du projet :

1. `0001_initial_schema.sql` : Schema initial (tables `profiles`, `organizer_requests`, `events`, `reservations`, `tickets`, `payments` et politiques RLS).
2. `0002_rpc_functions.sql` : Fonctions RPC transactionnelles (`create_reservation`, `submit_event`, `approve_event`, etc.).
3. `0003_organizer_event_reservations.sql` : Consultation securisee des reservations pour l'organisateur.
4. `0004_cancel_event.sql` : Annulation d'evenement par son organisateur.
5. `0005_profile_and_currency.sql` : Devise XOF et mise a jour de profil.
6. `0006_update_event.sql` : Modification d'evenement par l'organisateur.
7. `0007_statistics.sql` : Fonctions statistiques RPC (organisateur et admin).
8. `0008_admin_users.sql` : Administration des utilisateurs (role, blocage).
9. `0009_performance_indexes.sql` : Index de performance et bucket storage `organizer-documents`.
10. `0010_sql_invariants_and_rls.sql` : Invariants SQL, RLS insertion `DRAFT` et securisation de `create_reservation`.
11. `0011_event_lifecycle_and_public_details.sql` : Cycle de vie, trigger invariants, annulation atomique, disponibilite publique et protection du role organisateur.
12. `0012_organizer_request_description.sql` : Persistance de la description de candidature organisateur (20-1000 caracteres).
13. `0013_schedule_finish_expired_events.sql` : Planification horaire via `pg_cron` de la finalisation des evenements expirés (`finish_expired_events()`).

## Validation en Integration Continue (CI)

Le workflow GitHub Actions (`.github/workflows/backend-ci.yml`) teste automatiquement ces migrations sur une base PostgreSQL 16 vide. Il execute d'abord `test-bootstrap.sql` pour instancier les schemas minimaux (`auth`, `storage`, `cron`), puis applique l'ensemble des fichiers SQL avec `ON_ERROR_STOP=1`. Cela permet de detecter toute regression de syntaxe ou d'invariants sans affecter l'environnement de production.


## Consequence pour le backend

Les controleurs Node.js appellent notamment les fonctions RPC de reservation, d'approbation et d'annulation. Ces fonctions font partie du contrat backend et doivent donc etre versionnees avec la base, pas seulement conservees dans l'historique du SQL Editor.
