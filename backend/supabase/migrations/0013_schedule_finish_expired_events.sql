-- 0013 : Planification automatique de cloture des evenements expires (pg_cron).
--
-- Active l'extension pg_cron (disponible nativement dans Supabase) et planifie
-- l'execution de public.finish_expired_events() toutes les heures a la minute 0.
--
-- Les privileges d'execution de la fonction etant revoques a anon et authenticated,
-- l'appel est effectue dans le contexte securise du superutilisateur/postgres.

create extension if not exists pg_cron with schema extensions;

-- Nettoyer tout job existant portant le meme nom pour eviter les doublons
do $$
begin
    if exists (select 1 from cron.job where jobname = 'finish-expired-events-hourly') then
        perform cron.unschedule('finish-expired-events-hourly');
    end if;
exception
    when undefined_table then
        null;
end;
$$;

-- Planification toutes les heures (0 * * * *)
select cron.schedule(
    'finish-expired-events-hourly',
    '0 * * * *',
    $$select public.finish_expired_events();$$
);
