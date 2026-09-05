-- Annulation securisee d'un evenement par son organisateur.

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

    select * into event_row from public.events where id = p_event_id;
    return event_row;
end;
$$;
