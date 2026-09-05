-- Script de lecture seule a executer dans Supabase SQL Editor.
-- Il n'ajoute, ne modifie et ne supprime aucune donnee.

-- 1. Tables et colonnes applicatives.
select
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 2. Contraintes et relations.
select
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
    and tc.table_schema = kcu.table_schema
left join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
    and tc.table_schema = ccu.table_schema
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;

-- 3. Fonctions RPC du schema public.
select
    routine_name,
    data_type as return_type,
    routine_definition
from information_schema.routines
where routine_schema = 'public'
order by routine_name;

-- 4. Triggers applicatifs.
select
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;

-- 5. Politiques RLS.
select
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
