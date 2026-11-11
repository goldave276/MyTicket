-- Migration 0020 : Suppression et annulation d'urgence d'événement par l'administrateur

-- 1. Politique RLS autorisant les ADMINs à supprimer physiquement des événements
create policy "Admins can delete events"
    on public.events for delete to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'ADMIN'
        )
    );

-- 2. Fonction RPC atomique delete_or_cancel_event
create or replace function public.delete_or_cancel_event(
    p_event_id bigint,
    p_force_delete boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_event public.events;
    v_is_admin boolean;
    v_res_count int;
    v_action text;
begin
    -- Vérification des droits : ADMIN ou organisateur propriétaire
    select (role = 'ADMIN') into v_is_admin from public.profiles where id = auth.uid();

    select * into v_event
    from public.events
    where id = p_event_id
    for update;

    if not found then
        raise exception 'Evenement introuvable';
    end if;

    if not coalesce(v_is_admin, false) and v_event.organizer_id <> auth.uid() then
        raise exception 'Action non autorisee';
    end if;

    -- Compter les réservations associées
    select count(*) into v_res_count
    from public.reservations
    where event_id = p_event_id;

    if v_res_count = 0 or p_force_delete then
        -- Suppression physique complète
        delete from public.events where id = p_event_id;
        v_action := 'DELETED';
    else
        -- Annulation d'urgence (même si non terminé)
        update public.events
        set status = 'CANCELLED', updated_at = now()
        where id = p_event_id;

        update public.reservations
        set status = 'CANCELLED'
        where event_id = p_event_id
          and status in ('PENDING', 'CONFIRMED');

        v_action := 'CANCELLED';
    end if;

    return jsonb_build_object(
        'event_id', p_event_id,
        'action', v_action,
        'reservations_count', v_res_count
    );
end;
$$;

