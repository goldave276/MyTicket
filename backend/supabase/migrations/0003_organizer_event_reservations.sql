-- Lecture securisee des reservations d'un evenement par son organisateur.

create or replace function public.get_organizer_event_reservations(
    p_event_id bigint
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if not exists (
        select 1
        from public.events
        where id = p_event_id
          and organizer_id = auth.uid()
    ) then
        raise exception 'Evenement introuvable ou non autorise';
    end if;

    return query
    select r.*
    from public.reservations r
    where r.event_id = p_event_id
    order by r.created_at desc;
end;
$$;
