-- Statistiques securisees pour les espaces organisateur et administrateur.

create or replace function public.get_organizer_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare result jsonb;
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;

    select jsonb_build_object(
        'events_total', (select count(*) from public.events where organizer_id = auth.uid()),
        'events_approved', (select count(*) from public.events where organizer_id = auth.uid() and status = 'APPROVED'),
        'events_pending', (select count(*) from public.events where organizer_id = auth.uid() and status = 'PENDING'),
        'reservations_total', coalesce((
            select count(*) from public.reservations r
            join public.events e on e.id = r.event_id
            where e.organizer_id = auth.uid()
        ), 0),
        'places_reserved', coalesce((
            select sum(r.quantity) from public.reservations r
            join public.events e on e.id = r.event_id
            where e.organizer_id = auth.uid() and r.status = 'CONFIRMED'
        ), 0),
        'revenue_confirmed', coalesce((
            select sum(p.amount) from public.payments p
            join public.reservations r on r.id = p.reservation_id
            join public.events e on e.id = r.event_id
            where e.organizer_id = auth.uid() and p.status = 'SUCCEEDED'
        ), 0)
    ) into result;
    return result;
end;
$$;

create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare result jsonb;
begin
    if not exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'ADMIN'
    ) then
        raise exception 'Permission insuffisante';
    end if;

    select jsonb_build_object(
        'users_total', (select count(*) from public.profiles),
        'organizers_total', (select count(*) from public.profiles where role = 'ORGANIZER'),
        'events_total', (select count(*) from public.events),
        'events_approved', (select count(*) from public.events where status = 'APPROVED'),
        'reservations_total', (select count(*) from public.reservations),
        'tickets_active', (select count(*) from public.tickets where status = 'ACTIVE'),
        'payments_succeeded', (select count(*) from public.payments where status = 'SUCCEEDED'),
        'revenue_confirmed', coalesce((select sum(amount) from public.payments where status = 'SUCCEEDED'), 0)
    ) into result;
    return result;
end;
$$;
