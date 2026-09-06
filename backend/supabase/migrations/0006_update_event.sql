-- Modification securisee d'un brouillon d'evenement par son organisateur.

create or replace function public.update_event(
    p_event_id bigint,
    p_title text,
    p_description text,
    p_event_type text,
    p_event_date timestamptz,
    p_location text,
    p_capacity integer,
    p_price numeric
)
returns public.events
language plpgsql
security definer
set search_path = public, auth
as $$
declare event_row public.events;
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;

    if p_title is null or btrim(p_title) = ''
       or p_description is null or btrim(p_description) = ''
       or p_event_type is null or btrim(p_event_type) = ''
       or p_location is null or btrim(p_location) = '' then
        raise exception 'Les informations obligatoires sont manquantes';
    end if;
    if p_capacity is null or p_capacity <= 0 then
        raise exception 'La capacite doit etre positive';
    end if;
    if p_price is null or p_price < 0 then
        raise exception 'Le prix doit etre positif ou nul';
    end if;
    if p_event_date is null or p_event_date <= now() then
        raise exception 'La date doit etre valide et future';
    end if;

    update public.events
    set title = btrim(p_title),
        description = btrim(p_description),
        event_type = btrim(p_event_type),
        event_date = p_event_date,
        location = btrim(p_location),
        capacity = p_capacity,
        price = p_price,
        updated_at = now()
    where id = p_event_id
      and organizer_id = auth.uid()
      and status in ('DRAFT', 'REJECTED');

    if not found then
        raise exception 'Evenement introuvable ou non modifiable';
    end if;

    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;
