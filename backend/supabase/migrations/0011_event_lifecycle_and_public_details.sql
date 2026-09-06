-- Cycle de vie des evenements, invariants non contournables et detail public.
-- Cette migration ne modifie pas le flux de paiement.

-- Les controles HTTP peuvent etre contournes par un client Supabase authentifie.
-- Le trigger rend donc les contraintes metier essentielles applicables en base.
create or replace function public.enforce_event_invariants()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        if new.status <> 'DRAFT' then
            raise exception 'Un evenement doit etre cree au statut DRAFT';
        end if;

        if new.event_date <= now() then
            raise exception 'La date de l evenement doit etre future';
        end if;
    elsif new.event_date is distinct from old.event_date and new.event_date <= now() then
        raise exception 'La date de l evenement doit etre future';
    end if;

    if new.capacity < 1 or new.capacity > 100000 then
        raise exception 'La capacite doit etre comprise entre 1 et 100000';
    end if;

    if new.price < 0 or new.price > 100000000 then
        raise exception 'Le prix est hors limites';
    end if;

    if char_length(btrim(new.title)) not between 3 and 150
       or char_length(btrim(new.description)) not between 10 and 5000
       or char_length(btrim(new.event_type)) not between 2 and 80
       or char_length(btrim(new.location)) not between 2 and 200 then
        raise exception 'Les champs de l evenement ne respectent pas les longueurs autorisees';
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_event_invariants_before_write on public.events;
create trigger enforce_event_invariants_before_write
    before insert or update on public.events
    for each row execute function public.enforce_event_invariants();

-- Une demande creee directement via Supabase doit rester une demande en attente.
drop policy if exists "Users can create own organizer request" on public.organizer_requests;
create policy "Users can create own pending organizer request"
    on public.organizer_requests for insert to authenticated
    with check (
        auth.uid() = user_id
        and status = 'PENDING'
        and admin_comment is null
    );

-- L'exception annule toute transaction PostgreSQL. La fonction de reservation
-- doit donc refuser un evenement passe sans essayer de le passer en FINISHED.
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

    select * into event_row from public.events
    where id = p_event_id for update;

    if not found then
        raise exception 'Evenement introuvable';
    end if;

    if event_row.status <> 'APPROVED' or event_row.event_date <= now() then
        raise exception 'Cet evenement n est pas disponible';
    end if;

    select coalesce(sum(quantity), 0) into current_reserved
    from public.reservations
    where event_id = p_event_id
      and status in ('PENDING', 'CONFIRMED');

    if current_reserved + p_quantity > event_row.capacity then
        raise exception 'Nombre de places insuffisant';
    end if;

    insert into public.reservations (event_id, user_id, quantity, status)
    values (p_event_id, auth.uid(), p_quantity, 'PENDING')
    returning * into reservation_row;

    return reservation_row;
end;
$$;

-- Cette fonction est prevue pour un cron Supabase ou un job serveur execute
-- avec des privileges de base. Elle persiste le statut sans lever d'exception.
create or replace function public.finish_expired_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare updated_count integer;
begin
    update public.events
    set status = 'FINISHED', updated_at = now()
    where status = 'APPROVED'
      and event_date <= now();

    get diagnostics updated_count = row_count;
    return updated_count;
end;
$$;

revoke all on function public.finish_expired_events() from public, anon, authenticated;

-- Annuler un evenement rend ses reservations inutilisables et desactive les
-- billets associes. Les remboursements restent hors du perimetre de cette migration.
create or replace function public.cancel_event(p_event_id bigint)
returns public.events
language plpgsql
security definer
set search_path = public, auth
as $$
declare event_row public.events;
begin
    select * into event_row
    from public.events
    where id = p_event_id
      and organizer_id = auth.uid()
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

-- Le catalogue ne peut pas lire les reservations par RLS. Cette RPC expose
-- uniquement le detail public et le nombre de places restantes.
create or replace function public.get_public_event_detail(p_event_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
    select jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'eventType', e.event_type,
        'eventDate', e.event_date,
        'location', e.location,
        'capacity', e.capacity,
        'price', e.price,
        'currency', e.currency,
        'remainingCapacity', greatest(
            e.capacity - coalesce((
                select sum(r.quantity)
                from public.reservations r
                where r.event_id = e.id
                  and r.status in ('PENDING', 'CONFIRMED')
            ), 0),
            0
        )
    ) into result
    from public.events e
    where e.id = p_event_id
      and e.status = 'APPROVED'
      and e.event_date > now();

    return result;
end;
$$;

grant execute on function public.get_public_event_detail(bigint) to anon, authenticated;

-- Securisation de l'attribution / retrogradation de role :
-- Un administrateur ne peut pas retrograder un organisateur vers le role USER
-- s'il possede encore des evenements actifs ou futurs (statut APPROVED ou PENDING avec date future).
create or replace function public.admin_update_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare 
    profile_row public.profiles;
    active_events_count integer;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    if p_role not in ('USER', 'ORGANIZER', 'ADMIN') then
        raise exception 'Role invalide';
    end if;
    if p_user_id = auth.uid() and p_role <> 'ADMIN' then
        raise exception 'Un administrateur ne peut pas retirer son propre role';
    end if;

    -- Si on retrograde un ORGANIZER vers USER, verifier qu'il n'a pas d'evenements actifs ou futurs
    if p_role = 'USER' then
        select count(*) into active_events_count
        from public.events
        where organizer_id = p_user_id
          and status in ('APPROVED', 'PENDING')
          and event_date > now();

        if active_events_count > 0 then
            raise exception 'Impossible de retrograder un organisateur ayant des evenements actifs ou futurs';
        end if;
    end if;

    update public.profiles set role = p_role where id = p_user_id;
    if not found then raise exception 'Utilisateur introuvable'; end if;
    select * into profile_row from public.profiles where id = p_user_id;
    return profile_row;
end;
$$;
