-- Fonctions RPC metier de MyTicket.

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
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;
    if p_quantity <= 0 then
        raise exception 'La quantite doit etre positive';
    end if;

    select * into event_row from public.events
    where id = p_event_id for update;
    if not found then raise exception 'Evenement introuvable'; end if;
    if event_row.status <> 'APPROVED' then
        raise exception 'Cet evenement n est pas disponible';
    end if;

    select coalesce(sum(quantity), 0) into current_reserved
    from public.reservations
    where event_id = p_event_id and status = 'CONFIRMED';
    if current_reserved + p_quantity > event_row.capacity then
        raise exception 'Nombre de places insuffisant';
    end if;

    insert into public.reservations (event_id, user_id, quantity, status)
    values (p_event_id, auth.uid(), p_quantity, 'CONFIRMED')
    returning * into reservation_row;

    insert into public.tickets (reservation_id, event_id, user_id)
    select reservation_row.id, reservation_row.event_id, reservation_row.user_id
    from generate_series(1, reservation_row.quantity);
    return reservation_row;
end;
$$;

create or replace function public.cancel_reservation(p_reservation_id bigint)
returns public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
declare reservation_row public.reservations;
begin
    select * into reservation_row from public.reservations
    where id = p_reservation_id and user_id = auth.uid() for update;
    if not found then raise exception 'Reservation introuvable ou non autorisee'; end if;
    if reservation_row.status <> 'CONFIRMED' then
        raise exception 'Cette reservation ne peut pas etre annulee';
    end if;
    update public.reservations set status = 'CANCELLED' where id = p_reservation_id;
    update public.tickets set status = 'CANCELLED' where reservation_id = p_reservation_id;
    select * into reservation_row from public.reservations where id = p_reservation_id;
    return reservation_row;
end;
$$;

create or replace function public.submit_event(p_event_id bigint)
returns public.events
language plpgsql security definer set search_path = public, auth
as $$
declare event_row public.events;
begin
    select * into event_row from public.events
    where id = p_event_id and organizer_id = auth.uid() for update;
    if not found then raise exception 'Evenement introuvable ou non autorise'; end if;
    if event_row.status <> 'DRAFT' then
        raise exception 'Seul un brouillon peut etre soumis';
    end if;
    update public.events set status = 'PENDING', updated_at = now() where id = p_event_id;
    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;

create or replace function public.approve_event(p_event_id bigint)
returns public.events
language plpgsql security definer set search_path = public, auth
as $$
declare event_row public.events;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    select * into event_row from public.events where id = p_event_id for update;
    if not found then raise exception 'Evenement introuvable'; end if;
    if event_row.status <> 'PENDING' then
        raise exception 'Seul un evenement PENDING peut etre approuve';
    end if;
    update public.events set status = 'APPROVED', updated_at = now() where id = p_event_id;
    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;

create or replace function public.reject_event(p_event_id bigint)
returns public.events
language plpgsql security definer set search_path = public, auth
as $$
declare event_row public.events;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    update public.events set status = 'REJECTED', updated_at = now()
    where id = p_event_id and status = 'PENDING';
    if not found then raise exception 'Evenement introuvable ou non PENDING'; end if;
    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;

create or replace function public.approve_organizer_request(p_request_id bigint)
returns public.organizer_requests
language plpgsql security definer set search_path = public, auth
as $$
declare request_row public.organizer_requests;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    select * into request_row from public.organizer_requests
    where id = p_request_id for update;
    if not found then raise exception 'Demande introuvable'; end if;
    if request_row.status <> 'PENDING' then
        raise exception 'La demande n est plus en attente';
    end if;
    update public.organizer_requests set status = 'APPROVED', updated_at = now()
    where id = p_request_id;
    update public.profiles set role = 'ORGANIZER' where id = request_row.user_id;
    select * into request_row from public.organizer_requests where id = p_request_id;
    return request_row;
end;
$$;

create or replace function public.reject_organizer_request(
    p_request_id bigint,
    p_admin_comment text default null
)
returns public.organizer_requests
language plpgsql security definer set search_path = public, auth
as $$
declare request_row public.organizer_requests;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    update public.organizer_requests
    set status = 'REJECTED', admin_comment = p_admin_comment, updated_at = now()
    where id = p_request_id and status = 'PENDING';
    if not found then raise exception 'Demande introuvable ou non PENDING'; end if;
    select * into request_row from public.organizer_requests where id = p_request_id;
    return request_row;
end;
$$;

create or replace function public.create_payment_for_reservation(
    p_reservation_id bigint,
    p_payment_method text
)
returns public.payments
language plpgsql security definer set search_path = public, auth
as $$
declare
    reservation_row public.reservations;
    event_price numeric;
    event_currency varchar(3);
    payment_row public.payments;
    selected_provider text;
begin
    if auth.uid() is null then raise exception 'Authentification requise'; end if;
    if p_payment_method not in ('CARD', 'PAYPAL', 'MOBILE_MONEY', 'ON_SITE') then
        raise exception 'Mode de paiement invalide';
    end if;
    select * into reservation_row from public.reservations
    where id = p_reservation_id and user_id = auth.uid() for update;
    if not found then raise exception 'Reservation introuvable ou non autorisee'; end if;
    if reservation_row.status <> 'PENDING' then
        raise exception 'Cette reservation n est plus en attente';
    end if;
    select e.price, e.currency into event_price, event_currency
    from public.events e where e.id = reservation_row.event_id;
    if not found then raise exception 'Evenement introuvable'; end if;
    selected_provider := case p_payment_method
        when 'ON_SITE' then 'MANUAL'
        when 'PAYPAL' then 'PAYPAL'
        when 'CARD' then 'STRIPE'
        else 'MOBILE_MONEY' end;
    insert into public.payments (
        reservation_id, user_id, amount, currency, payment_method, provider, status
    ) values (
        reservation_row.id, auth.uid(), event_price * reservation_row.quantity,
        event_currency, p_payment_method, selected_provider, 'PENDING'
    ) returning * into payment_row;
    return payment_row;
end;
$$;

create or replace function public.confirm_on_site_payment(p_payment_id bigint)
returns public.payments
language plpgsql security definer set search_path = public, auth
as $$
declare
    payment_row public.payments;
    reservation_row public.reservations;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    select * into payment_row from public.payments where id = p_payment_id for update;
    if not found then raise exception 'Paiement introuvable'; end if;
    if payment_row.payment_method <> 'ON_SITE' then
        raise exception 'Ce paiement n est pas un paiement sur place';
    end if;
    if payment_row.status <> 'PENDING' then
        raise exception 'Ce paiement n est plus en attente';
    end if;
    select * into reservation_row from public.reservations
    where id = payment_row.reservation_id for update;
    update public.payments set status = 'SUCCEEDED', confirmed_by = auth.uid(),
        confirmed_at = now(), updated_at = now() where id = p_payment_id;
    update public.reservations set status = 'CONFIRMED'
    where id = payment_row.reservation_id;
    insert into public.tickets (reservation_id, event_id, user_id)
    select reservation_row.id, reservation_row.event_id, reservation_row.user_id
    from generate_series(1, reservation_row.quantity);
    select * into payment_row from public.payments where id = p_payment_id;
    return payment_row;
end;
$$;

-- Fonction conservee pour compatibilite avec le schema actuel.
-- Aucun trigger ne l'appelle dans le flux actuel : create_reservation et
-- confirm_on_site_payment generent eux-memes les tickets.
create or replace function public.generate_tickets_for_reservation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    insert into public.tickets (reservation_id, event_id, user_id)
    select new.id, new.event_id, new.user_id
    from generate_series(1, new.quantity);
    return new;
end;
$$;
