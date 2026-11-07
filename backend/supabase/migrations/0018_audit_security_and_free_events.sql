-- Migration 0018 : Correctifs de sécurité et confirmation automatique des événements gratuits
-- 1. Verrouillage explicite de promote_user_to_admin et confirm_online_payment au service_role
-- 2. Suppression de la policy en doublon issue de 0016 (casse "admins" vs "Admins")
-- 3. Confirmation immédiate et génération atomique des billets pour les événements gratuits (price = 0)

drop policy if exists "Organizers and admins can create own events in DRAFT only" on public.events;

revoke all on function public.confirm_online_payment(bigint, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_online_payment(bigint, text, text, jsonb) to service_role;

revoke all on function public.promote_user_to_admin(text) from public, anon, authenticated;
grant execute on function public.promote_user_to_admin(text) to service_role;

create or replace function public.create_reservation(
    p_event_id bigint,
    p_quantity integer
)
returns public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    event_row public.events;
    current_reserved integer;
    reservation_row public.reservations;
    initial_status text;
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;

    if p_quantity <= 0 or p_quantity > 100 then
        raise exception 'La quantite doit etre comprise entre 1 et 100';
    end if;

    select * into event_row from public.events
    where id = p_event_id for update;

    if not found then
        raise exception 'Evenement introuvable';
    end if;

    if event_row.status <> 'APPROVED' or event_row.event_date <= now() then
        raise exception 'Cet evenement n est pas disponible';
    end if;

    select coalesce(sum(quantity), 0) into current_reserved
    from public.reservations
    where event_id = p_event_id
      and status in ('PENDING', 'CONFIRMED');

    if current_reserved + p_quantity > event_row.capacity then
        raise exception 'Nombre de places insuffisant';
    end if;

    initial_status := case when coalesce(event_row.price, 0) = 0 then 'CONFIRMED' else 'PENDING' end;

    insert into public.reservations (event_id, user_id, quantity, status)
    values (p_event_id, auth.uid(), p_quantity, initial_status)
    returning * into reservation_row;

    if initial_status = 'CONFIRMED' then
        insert into public.tickets (reservation_id, event_id, user_id)
        select reservation_row.id, reservation_row.event_id, reservation_row.user_id
        from generate_series(1, reservation_row.quantity);
    end if;

    return reservation_row;
end;
$$;
