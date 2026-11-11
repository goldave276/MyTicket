-- ==============================================================================
-- Migration 0019 : Résolution de la récursion infinie RLS sur public.profiles
-- ==============================================================================
-- CAUSE :
-- Dans la base Supabase actuelle, une ou plusieurs politiques RLS sur la table
-- public.profiles ou sur les tables dépendantes effectuent un SELECT sur public.profiles,
-- ce qui déclenche une boucle infinie de récursion (« infinite recursion detected in policy for relation "profiles" »).
--
-- REMÈDE :
-- 1. Créer une fonction SECURITY DEFINER `public.get_my_role()` et `public.is_admin()`
--    qui lit le rôle dans public.profiles en contournant le RLS (sans récursion).
-- 2. Réinitialiser la politique RLS sur public.profiles avec une règle d'accès directe
--    et sans sous-requête récursive.
-- ==============================================================================

-- 1. Fonctions utilitaires SECURITY DEFINER sans RLS récursif
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
    select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select coalesce((select role = 'ADMIN' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_organizer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select coalesce((select role in ('ORGANIZER', 'ADMIN') from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organizer_or_admin() to authenticated;

-- 2. Nettoyage et assainissement des politiques RLS sur public.profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Chaque utilisateur authentifié peut lire son propre profil sans sous-requête
create policy "Users can read own profile"
    on public.profiles for select to authenticated
    using (auth.uid() = id or public.is_admin());

-- 3. Assainissement des politiques d'insertion/lecture sur public.events
drop policy if exists "Organizers can create own events" on public.events;
drop policy if exists "Organizers can create own events in DRAFT only" on public.events;
drop policy if exists "Organizers and admins can create own events in DRAFT only" on public.events;
drop policy if exists "Organizers and Admins can create own events in DRAFT only" on public.events;

create policy "Organizers and Admins can create own events in DRAFT only"
    on public.events for insert to authenticated
    with check (
        auth.uid() = organizer_id
        and status = 'DRAFT'
        and public.is_organizer_or_admin()
    );

drop policy if exists "Admins can read all events" on public.events;
create policy "Admins can read all events"
    on public.events for select to authenticated
    using (public.is_admin());

-- 4. Assainissement des politiques sur public.organizer_requests
drop policy if exists "Admins can read all organizer requests" on public.organizer_requests;
create policy "Admins can read all organizer requests"
    on public.organizer_requests for select to authenticated
    using (public.is_admin());

-- 5. Assainissement des politiques sur public.reservations et tickets
drop policy if exists "Admins can read all reservations" on public.reservations;
create policy "Admins can read all reservations"
    on public.reservations for select to authenticated
    using (public.is_admin());

drop policy if exists "Admins can read all tickets" on public.tickets;
create policy "Admins can read all tickets"
    on public.tickets for select to authenticated
    using (public.is_admin());

drop policy if exists "Admins can read all payments" on public.payments;
create policy "Admins can read all payments"
    on public.payments for select to authenticated
    using (public.is_admin());

-- 6. Correction de la fonction admin_list_users (ambiguïté sur id)
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
    if not public.is_admin() then
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
