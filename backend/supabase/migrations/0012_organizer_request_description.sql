-- 0012 : persistance de la description de candidature organisateur.
--
-- Le formulaire "Devenir organisateur" exige une presentation de l'activite,
-- mais la colonne n'existait pas : le texte etait perdu. La colonne reste
-- nullable pour ne pas invalider les demandes historiques ; toute nouvelle
-- demande doit en revanche en fournir une (policy d'insertion ci-dessous).

alter table public.organizer_requests
    add column if not exists description text;

alter table public.organizer_requests
    drop constraint if exists organizer_requests_description_length_check;

alter table public.organizer_requests
    add constraint organizer_requests_description_length_check
    check (
        description is null
        or char_length(btrim(description)) between 20 and 1000
    );

-- Remplace la policy de 0011 : meme regles + description obligatoire pour
-- toute demande creee directement via Supabase (contournement de l'API).
drop policy if exists "Users can create own pending organizer request" on public.organizer_requests;
create policy "Users can create own pending organizer request"
    on public.organizer_requests for insert to authenticated
    with check (
        auth.uid() = user_id
        and status = 'PENDING'
        and admin_comment is null
        and description is not null
    );
