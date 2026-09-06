-- Profil utilisateur et devise par defaut du MVP Togo.

alter table public.payments
    alter column currency set default 'XOF';

create or replace function public.update_my_profile(p_full_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare profile_row public.profiles;
begin
    if auth.uid() is null then
        raise exception 'Authentification requise';
    end if;

    if p_full_name is null or not btrim(p_full_name) <> '' then
        raise exception 'Le nom complet est obligatoire';
    end if;

    update public.profiles
    set full_name = btrim(p_full_name)
    where id = auth.uid();

    if not found then
        raise exception 'Profil introuvable';
    end if;

    select * into profile_row
    from public.profiles
    where id = auth.uid();
    return profile_row;
end;
$$;
