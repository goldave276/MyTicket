-- Migration 0021 : Assouplissement des réservations multiples par utilisateur
-- Permet aux utilisateurs d'effectuer plusieurs réservations sur un même événement (ex: rachat de places ou après annulation).
-- Supprime la contrainte restrictive one_reservation_per_user_event si elle existe sur la table public.reservations.

alter table public.reservations drop constraint if exists one_reservation_per_user_event;
drop index if exists public.one_reservation_per_user_event;
drop index if exists public.reservations_user_event_idx;
