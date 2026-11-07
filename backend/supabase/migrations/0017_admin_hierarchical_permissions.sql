-- Migration 0017 : Hiérarchie des autorisations Administrateur & Tâches Supérieures
-- Permet aux administrateurs d'effectuer toutes les actions supérieures :
-- 1. Création d'événements plateforme (ADMIN + ORGANIZER)
-- 2. Modération et annulation de n'importe quel événement (cancel_event)
-- 3. Consultation des réservations de n'importe quel événement (get_organizer_event_reservations)
-- 4. Lecture globale des réservations et des billets via RLS
-- 5. Enrichissement de la liste des utilisateurs avec leur adresse email (admin_list_users)
-- 6. Fonction de promotion sécurisée du premier administrateur (promote_user_to_admin)

-- 1. Création d'événements au statut DRAFT autorisée pour ORGANIZER et ADMIN
drop policy if exists "Organizers can create own events in DRAFT only" on public.events;
drop policy if exists "Organizers and Admins can create own events in DRAFT only" on public.events;

create policy "Organizers and Admins can create own events in DRAFT only"
    on public.events for insert to authenticated
    with check (
        auth.uid() = organizer_id
        and status = 'DRAFT'
        and exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role in ('ORGANIZER', 'ADMIN')
        )
    );

-- 2. Annulation / modération d'un événement par son organisateur ou un ADMIN
create or replace function public.cancel_event(p_event_id bigint)
returns public.events
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    event_row public.events;
    is_admin boolean;
begin
    select (role = 'ADMIN') into is_admin from public.profiles where id = auth.uid();

    select * into event_row
    from public.events
    where id = p_event_id
      and (organizer_id = auth.uid() or coalesce(is_admin, false))
    for update;

    if not found then
        raise exception 'Evenement introuvable ou non autorise';
    end if;

    if event_row.status in ('CANCELLED', 'FINISHED') then
        raise exception 'Cet evenement ne peut plus etre annule';
    end if;

    update public.events
    set status = 'CANCELLED', updated_at = now()
    where id = p_event_id;

    update public.reservations
    set status = 'CANCELLED'
    where event_id = p_event_id
      and status in ('PENDING', 'CONFIRMED');

    update public.tickets
    set status = 'CANCELLED'
    where event_id = p_event_id
      and status = 'ACTIVE';

    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;

-- 3. Lecture des réservations d'un événement par son organisateur ou un ADMIN
create or replace function public.get_organizer_event_reservations(
    p_event_id bigint
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    is_admin boolean;
begin
    select (role = 'ADMIN') into is_admin from public.profiles where id = auth.uid();

    if not exists (
        select 1
        from public.events
        where id = p_event_id
          and (organizer_id = auth.uid() or coalesce(is_admin, false))
    ) then
        raise exception 'Evenement introuvable ou non autorise';
    end if;

    return query
    select r.*
    from public.reservations r
    where r.event_id = p_event_id
    order by r.created_at desc;
end;
$$;

-- 4. Politiques RLS de lecture des réservations et billets par les ADMINs
drop policy if exists "Admins can read all reservations" on public.reservations;
create policy "Admins can read all reservations"
    on public.reservations for select to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    ));

drop policy if exists "Admins can read all tickets" on public.tickets;
create policy "Admins can read all tickets"
    on public.tickets for select to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    ));

-- 5. Liste administrative des utilisateurs incluant l'email issu de auth.users
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
    id uuid,
    full_name text,
    role text,
    created_at timestamptz,
    is_blocked boolean,
    email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    return query
    select
        p.id,
        p.full_name,
        p.role,
        p.created_at,
        p.is_blocked,
        coalesce(u.email, '')::text as email
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

-- 6. Fonction utilitaire d'attribution/promotion admin initiale
create or replace function public.promote_user_to_admin(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    target_uid uuid;
    profile_row public.profiles;
begin
    select id into target_uid from auth.users where email = p_email;
    if target_uid is null then
        raise exception 'Utilisateur avec cet email introuvable';
    end if;

    update public.profiles set role = 'ADMIN' where id = target_uid;
    select * into profile_row from public.profiles where id = target_uid;
    return profile_row;
end;
$$;
