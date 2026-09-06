-- Index de performance et securisation du stockage des justificatifs.

-- 1. Index sur les evenements
create index if not exists idx_events_status_date
    on public.events (status, event_date);

create index if not exists idx_events_organizer
    on public.events (organizer_id);

-- 2. Index sur les reservations
create index if not exists idx_reservations_user
    on public.reservations (user_id);

create index if not exists idx_reservations_event_status
    on public.reservations (event_id, status);

-- 3. Index sur les tickets
create index if not exists idx_tickets_user
    on public.tickets (user_id);

create index if not exists idx_tickets_event
    on public.tickets (event_id);

create index if not exists idx_tickets_reservation
    on public.tickets (reservation_id);

-- 4. Index sur les paiements
create index if not exists idx_payments_reservation
    on public.payments (reservation_id);

create index if not exists idx_payments_user_status
    on public.payments (user_id, status);

-- 5. Index sur les demandes organisateur
create index if not exists idx_organizer_requests_user_status
    on public.organizer_requests (user_id, status);

-- 6. Securisation du bucket de stockage pour les justificatifs organisateurs
insert into storage.buckets (id, name, public)
values ('organizer-documents', 'organizer-documents', false)
on conflict (id) do nothing;

create policy "Users can upload own organizer document"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'organizer-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can read own organizer document"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'organizer-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Admins can read all organizer documents"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'organizer-documents'
        and exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'ADMIN'
        )
    );
