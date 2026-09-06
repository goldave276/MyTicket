-- Migration 0010 : Invariants SQL, durcissement RLS et vérifications temporelles de réservation.
-- A appliquer dans Supabase pour garantir l'intégrité des données au niveau de la base.

-- 1. Contrainte de capacité maximale sur les événements (<= 100 000 places)
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'events_capacity_max_check'
    ) then
        alter table public.events
            add constraint events_capacity_max_check check (capacity <= 100000);
    end if;
end $$;

-- 2. Durcissement RLS : un organisateur ne peut insérer un événement qu'au statut initial 'DRAFT'
drop policy if exists "Organizers can create own events" on public.events;
drop policy if exists "Organizers can create own events in DRAFT only" on public.events;

create policy "Organizers can create own events in DRAFT only"
    on public.events for insert to authenticated
    with check (
        auth.uid() = organizer_id
        and status = 'DRAFT'
        and exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'ORGANIZER'
        )
    );

-- 3. Mise à jour de la fonction RPC create_reservation :
-- - Validation stricte des bornes de quantité (1..100)
-- - Rejet des événements dont la date est passée (event_date <= now()) avec passage en FINISHED
-- - Verrouillage pessimiste (FOR UPDATE) pour éviter la surréservation concurrente
create or replace function public.create_reservation(
    p_event_id bigint,
    p_quantity integer
)
returns public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    event_row public.events;
    current_reserved integer;
    reservation_row public.reservations;
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;

    if p_quantity <= 0 or p_quantity > 100 then
        raise exception 'La quantite doit etre comprise entre 1 et 100';
    end if;

    -- Verrouillage de la ligne d'événement pour concurrence sûre
    select * into event_row from public.events
    where id = p_event_id for update;

    if not found then
        raise exception 'Evenement introuvable';
    end if;

    if event_row.status <> 'APPROVED' then
        raise exception 'Cet evenement n est pas disponible';
    end if;

    -- Vérification temporelle : refuser les événements passés et basculer en FINISHED
    if event_row.event_date <= now() then
        update public.events
        set status = 'FINISHED', updated_at = now()
        where id = p_event_id;

        raise exception 'Cet evenement est deja passe';
    end if;

    -- Vérification des places disponibles restantes
    select coalesce(sum(quantity), 0) into current_reserved
    from public.reservations
    where event_id = p_event_id
      and status in ('PENDING', 'CONFIRMED');

    if current_reserved + p_quantity > event_row.capacity then
        raise exception 'Nombre de places insuffisant';
    end if;

    -- Insertion atomique de la réservation
    insert into public.reservations (event_id, user_id, quantity, status)
    values (p_event_id, auth.uid(), p_quantity, 'PENDING')
    returning * into reservation_row;

    return reservation_row;
end;
$$;
