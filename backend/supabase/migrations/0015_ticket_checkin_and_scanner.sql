-- Migration 0015 : Contrôle d'accès et scanner de billets (Check-in)
-- Ajoute le statut 'USED' et les colonnes d'audit (scanned_at, scanned_by) sur tickets
-- Définit la fonction RPC transactionnelle scan_and_checkin_ticket pour les organisateurs et admins.

alter table public.tickets drop constraint if exists tickets_status_check;
alter table public.tickets add constraint tickets_status_check
    check (status in ('ACTIVE', 'USED', 'CANCELLED'));

alter table public.tickets add column if not exists scanned_at timestamptz;
alter table public.tickets add column if not exists scanned_by uuid references auth.users(id);

create or replace function public.scan_and_checkin_ticket(
    p_ticket_code uuid,
    p_event_id bigint
)
returns jsonb
language plpgsql security definer set search_path = public, auth
as $$
declare
    current_uid uuid;
    is_admin boolean;
    is_event_organizer boolean;
    ticket_row public.tickets;
    participant_name text;
    participant_email text;
begin
    current_uid := auth.uid();
    if current_uid is null then
        raise exception 'Authentification requise';
    end if;

    -- Vérifier que l'utilisateur est ADMIN ou organisateur légitime de cet événement
    select (role = 'ADMIN') into is_admin from public.profiles where id = current_uid;
    select exists (
        select 1 from public.events where id = p_event_id and organizer_id = current_uid
    ) into is_event_organizer;

    if not (coalesce(is_admin, false) or coalesce(is_event_organizer, false)) then
        raise exception 'Permission insuffisante pour scanner les billets de cet evenement';
    end if;

    -- Rechercher et verrouiller le billet
    select * into ticket_row
    from public.tickets
    where ticket_code = p_ticket_code and event_id = p_event_id
    for update;

    if not found then
        raise exception 'Billet introuvable pour cet evenement';
    end if;

    if ticket_row.status = 'CANCELLED' then
        raise exception 'Ce billet a ete annule';
    end if;

    if ticket_row.status = 'USED' then
        raise exception 'Billet deja utilise le %', to_char(ticket_row.scanned_at at time zone 'UTC', 'DD/MM/YYYY a HH24:MI:SS UTC');
    end if;

    -- Valider l'entrée et enregistrer le scan
    update public.tickets
    set status = 'USED',
        scanned_at = now(),
        scanned_by = current_uid
    where id = ticket_row.id;

    -- Récupérer les informations du participant
    select coalesce(p.full_name, 'Participant'), coalesce(u.email, '')
    into participant_name, participant_email
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = ticket_row.user_id;

    return jsonb_build_object(
        'ticket_id', ticket_row.id,
        'ticket_code', ticket_row.ticket_code,
        'status', 'USED',
        'scanned_at', now(),
        'participant_name', coalesce(participant_name, 'Participant'),
        'participant_email', coalesce(participant_email, ''),
        'reservation_id', ticket_row.reservation_id,
        'event_id', ticket_row.event_id
    );
end;
$$;

revoke all on function public.scan_and_checkin_ticket(uuid, bigint) from public;
grant execute on function public.scan_and_checkin_ticket(uuid, bigint) to authenticated;
