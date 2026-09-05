-- Requetes de lecture seule pour completer l'audit du schema Supabase.

-- Fonctions RPC et leurs arguments.
select
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- Triggers et fonction appelee.
select
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;

-- Contraintes et relations entre tables applicatives.
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
