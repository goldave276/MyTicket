-- Objets minimaux qui reproduisent les dependances Supabase pour le test CI.
-- Ce fichier n'est jamais a executer sur un projet Supabase reel.

create schema if not exists auth;
create schema if not exists storage;

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

-- Objets Storage minimaux requis par la migration 0009. Ils permettent a la
-- CI de verifier la syntaxe des policies sans reproduire Supabase Storage.
create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false
);

create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null,
    name text not null
);

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
    select string_to_array(name, '/');
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
    select null::uuid;
$$;

-- Objets cron minimaux requis par la migration 0013.
create schema if not exists cron;
create table if not exists cron.job (
    jobid bigint primary key generated always as identity,
    jobname text unique,
    schedule text,
    command text
);
create or replace function cron.unschedule(job_name text)
returns boolean
language sql
as $$
    delete from cron.job where jobname = job_name;
    select true;
$$;
create or replace function cron.schedule(job_name text, schedule_expr text, cmd text)
returns bigint
language sql
as $$
    insert into cron.job (jobname, schedule, command)
    values (job_name, schedule_expr, cmd)
    returning jobid;
$$;

