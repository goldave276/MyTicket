-- Migration 0022 : Disponibilité réelle des événements (catalogue & organisateur)
-- et enrichissement des réservations organisateur avec le nom et l'email du participant.

-- 1. Compteur agrégé anonyme des places réservées (PENDING ou CONFIRMED) par événement.
-- Expose uniquement les totaux agrégés sans divulguer les lignes individuelles sous RLS.
create or replace function public.get_events_booked_counts(p_event_ids bigint[])
returns table (
    event_id bigint,
    booked_seats bigint
)
language sql
security definer
set search_path = public
as $$
    select
        r.event_id,
        coalesce(sum(r.quantity), 0)::bigint as booked_seats
    from public.reservations r
    where r.event_id = any(p_event_ids)
      and r.status in ('PENDING', 'CONFIRMED')
    group by r.event_id;
$$;

revoke all on function public.get_events_booked_counts(bigint[]) from public;
grant execute on function public.get_events_booked_counts(bigint[]) to anon, authenticated, service_role;

-- 2. Lecture enrichie des réservations d'un événement pour son organisateur ou un ADMIN,
-- incluant le nom complet (profiles / user_metadata) et l'email (auth.users) du participant.
drop function if exists public.get_organizer_event_reservations(bigint);

create function public.get_organizer_event_reservations(
    p_event_id bigint
)
returns table (
    id bigint,
    event_id bigint,
    user_id uuid,
    quantity integer,
    status text,
    created_at timestamptz,
    participant_name text,
    participant_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    is_admin boolean;
begin
    select (p.role = 'ADMIN') into is_admin from public.profiles p where p.id = auth.uid();

    if not exists (
        select 1
        from public.events e
        where e.id = p_event_id
          and (e.organizer_id = auth.uid() or coalesce(is_admin, false))
    ) then
        raise exception 'Evenement introuvable ou non autorise';
    end if;

    return query
    select
        r.id,
        r.event_id,
        r.user_id,
        r.quantity,
        r.status,
        r.created_at,
        coalesce(
            nullif(btrim(p.full_name), ''),
            nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
            'Participant'
        )::text as participant_name,
        coalesce(u.email, '')::text as participant_email
    from public.reservations r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
    where r.event_id = p_event_id
    order by r.created_at desc;
end;
$$;

revoke all on function public.get_organizer_event_reservations(bigint) from public;
grant execute on function public.get_organizer_event_reservations(bigint) to authenticated, service_role;
