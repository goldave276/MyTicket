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
La generation des tickets est faite uniquement quand une reservation est
confirmee par `confirm_on_site_payment`.

## Signatures des `id`

- `profiles.id` : `uuid primary key references auth.users(id) on delete cascade`
- `organizer_requests.id` : `bigint generated always as identity primary key`
- `events.id` : `bigint generated always as identity primary key`
- `reservations.id` : `bigint generated always as identity primary key`
- `tickets.id` : `bigint generated always as identity primary key`
- `payments.id` : `bigint generated always as identity primary key`

Chaque colonne `bigint generated always as identity` est adossee a une sequence
PostgreSQL geree par l'identite. Aucun sequence applicative explicite n'est
decrite dans les migrations.

## Index applicatifs

- `profiles_pkey` sur `profiles(id)`
- `organizer_requests_pkey` sur `organizer_requests(id)`
- `organizer_requests_one_pending_per_user` sur `organizer_requests(user_id)` avec filtre `status = 'PENDING'`
- `events_pkey` sur `events(id)`
- `reservations_pkey` sur `reservations(id)`
- `tickets_pkey` sur `tickets(id)`
- `tickets_ticket_code_key` sur `tickets(ticket_code)`
- `payments_pkey` sur `payments(id)`
- `payments_provider_payment_id_key` sur `payments(provider_payment_id)`

## Correspondance backend

- `create_reservation` cree maintenant une reservation `PENDING`
- `create_payment_for_reservation` attend une reservation `PENDING`
- `confirm_on_site_payment` confirme la reservation puis genere les tickets
- `cancel_reservation` cible les reservations encore `PENDING`

Le contrat RPC et schema est maintenant aligne sur le flux "reservation en
attente jusqu'au paiement".
