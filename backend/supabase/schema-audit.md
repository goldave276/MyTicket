# Rapport d'audit du schema Supabase

## Elements confirmes

Tables applicatives :

- `profiles` : profil et role `USER`, `ORGANIZER` ou `ADMIN`.
- `organizer_requests` : demande organisateur avec statut `PENDING`, `APPROVED` ou `REJECTED`.
- `events` : evenement avec statut `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` ou `FINISHED`.
- `reservations` : reservation avec statut `PENDING`, `CONFIRMED` ou `CANCELLED`.
- `tickets` : ticket avec code UUID unique et statut `ACTIVE` ou `CANCELLED`.
- `payments` : paiement avec methode, fournisseur et statut.

Relations principales :

- les profils, organisateurs, utilisateurs et tickets referencent `auth.users` ;
- une reservation reference un evenement ;
- un ticket reference une reservation et un evenement ;
- un paiement reference une reservation ;
- les suppressions d'evenements, reservations ou utilisateurs utilisent des cascades selon le schema actuel.

Contraintes confirmees :

- `events.capacity > 0` ;
- `events.price >= 0` ;
- `reservations.quantity > 0` ;
- les statuts sont limites par des contraintes `CHECK` ;
- `tickets.ticket_code` est unique ;
- `payments.provider_payment_id` est unique.

## RLS confirmees

- les evenements approuves sont lisibles publiquement ;
- un utilisateur lit ses propres reservations, tickets, paiements et demandes ;
- un organisateur cree ses propres evenements ;
- un administrateur lit les demandes, evenements et paiements selon les politiques existantes.

## RPC confirmees

Le backend appelle les fonctions suivantes :

`approve_event`, `approve_organizer_request`, `cancel_reservation`,
`confirm_on_site_payment`, `create_payment_for_reservation`,
`create_reservation`, `reject_event`, `reject_organizer_request` et
`submit_event`.

Elles sont toutes marquees `SECURITY DEFINER`.

## Triggers confirmes

Le trigger applicatif actif est `on_auth_user_created` sur `auth.users`, qui
appelle `handle_new_user()` pour creer le profil.

Aucun trigger applicatif actif n'est attache a `reservations` ou `tickets`.
La generation des tickets est donc faite par les RPC de reservation et de
confirmation de paiement.

## Points a traiter avant la migration initiale

- recuperer la definition exacte des colonnes `id` et de leurs sequences ou identites ;
- exporter les definitions SQL completes des RPC ;
- verifier les index applicatifs ;
- tester le schema sur un projet Supabase de test ;
- decider si le flux de reservation est confirme immediatement ou reste `PENDING` avant paiement.

Tant que ces points ne sont pas valides, ne pas presenter ce rapport comme une
migration executable. La source actuelle reste le projet Supabase existant.
