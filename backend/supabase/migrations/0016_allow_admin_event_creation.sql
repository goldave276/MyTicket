-- Migration 0016 : Autorisation de création d'événements pour les administrateurs
-- Permet aux profils avec le rôle 'ADMIN' de créer des événements en statut DRAFT au même titre que les organisateurs.

drop policy if exists "Organizers can create own events in DRAFT only" on public.events;

create policy "Organizers and admins can create own events in DRAFT only"
    on public.events for insert to authenticated
    with check (
        auth.uid() = organizer_id
        and status = 'DRAFT'
        and exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role in ('ORGANIZER', 'ADMIN')
        )
    );
