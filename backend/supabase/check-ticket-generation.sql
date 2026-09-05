-- Controle de lecture seule des tickets generes.

-- 1. Verifie si un trigger genere encore des tickets automatiquement.
select
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
from pg_trigger
where not tgisinternal
  and tgrelid::regclass::text in ('public.reservations', 'public.tickets')
order by table_name, trigger_name;

-- 2. Detecte une quantite de tickets differente de la reservation.
select
    r.id as reservation_id,
    r.quantity,
    count(t.id) as ticket_count
from public.reservations r
left join public.tickets t on t.reservation_id = r.id
group by r.id, r.quantity
having count(t.id) <> r.quantity
order by r.id;
