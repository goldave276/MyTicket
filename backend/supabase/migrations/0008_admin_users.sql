-- Gestion des utilisateurs par un administrateur.

alter table public.profiles
    add column if not exists is_blocked boolean not null default false;

create or replace function public.admin_list_users()
returns setof public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    return query select * from public.profiles order by created_at desc;
end;
$$;

create or replace function public.admin_update_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare profile_row public.profiles;
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

    update public.profiles set role = p_role where id = p_user_id;
    if not found then raise exception 'Utilisateur introuvable'; end if;
    select * into profile_row from public.profiles where id = p_user_id;
    return profile_row;
end;
$$;

create or replace function public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare profile_row public.profiles;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
        raise exception 'Permission insuffisante';
    end if;
    if p_user_id = auth.uid() then
        raise exception 'Un administrateur ne peut pas se bloquer lui-meme';
    end if;

    update public.profiles set is_blocked = p_blocked where id = p_user_id;
    if not found then raise exception 'Utilisateur introuvable'; end if;
    select * into profile_row from public.profiles where id = p_user_id;
    return profile_row;
end;
$$;
