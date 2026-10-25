-- Migration 0014 : Fonction RPC confirm_online_payment pour valider les paiements Stripe et Mobile Money
-- Permet de confirmer un paiement en ligne depuis un webhook sécurisé,
-- d'associer le provider_payment_id et les métadonnées, de basculer la réservation en CONFIRMED
-- et d'émettre automatiquement les tickets associés de façon atomique et idempotente.

create or replace function public.confirm_online_payment(
    p_payment_id bigint,
    p_provider_payment_id text default null,
    p_provider text default null,
    p_metadata jsonb default null
)
returns public.payments
language plpgsql security definer set search_path = public, auth
as $$
declare
    payment_row public.payments;
    reservation_row public.reservations;
begin
    -- Verrouiller la ligne de paiement
    select * into payment_row from public.payments where id = p_payment_id for update;
    if not found then
        raise exception 'Paiement introuvable';
    end if;

    -- Idempotence : si le paiement est deja SUCCEEDED, ne rien faire de plus
    if payment_row.status = 'SUCCEEDED' then
        return payment_row;
    end if;

    if payment_row.status not in ('PENDING') then
        raise exception 'Ce paiement n est plus en attente';
    end if;

    -- Verrouiller la reservation correspondante
    select * into reservation_row from public.reservations
    where id = payment_row.reservation_id for update;
    if not found then
        raise exception 'Reservation introuvable';
    end if;

    -- Mettre a jour le statut du paiement en SUCCEEDED
    update public.payments
    set status = 'SUCCEEDED',
        provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
        provider = coalesce(p_provider, provider),
        metadata = coalesce(p_metadata, metadata),
        confirmed_at = now(),
        updated_at = now()
    where id = p_payment_id;

    -- Si la reservation etait encore en attente, la confirmer et emettre les billets
    if reservation_row.status = 'PENDING' then
        update public.reservations
        set status = 'CONFIRMED'
        where id = payment_row.reservation_id;

        insert into public.tickets (reservation_id, event_id, user_id)
        select reservation_row.id, reservation_row.event_id, reservation_row.user_id
        from generate_series(1, reservation_row.quantity);
    end if;

    select * into payment_row from public.payments where id = p_payment_id;
    return payment_row;
end;
$$;

revoke all on function public.confirm_online_payment(bigint, text, text, jsonb) from public;
grant execute on function public.confirm_online_payment(bigint, text, text, jsonb) to authenticated, service_role;
