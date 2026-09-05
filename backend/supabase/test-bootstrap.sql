-- Objets minimaux qui reproduisent les dependances Supabase pour le test CI.
-- Ce fichier n'est jamais a executer sur un projet Supabase reel.

create schema if not exists auth;

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
    end if;
end
$$;

create table if not exists auth.users (
    id uuid primary key,
    raw_user_meta_data jsonb
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
    select null::uuid;
$$;
