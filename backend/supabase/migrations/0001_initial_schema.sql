-- Schema applicatif initial de MyTicket.
-- A appliquer dans un projet Supabase de test avant toute production.

create extension if not exists pgcrypto;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text not null default 'USER',
    created_at timestamptz not null default now(),
    constraint profiles_role_check
        check (role in ('USER', 'ORGANIZER', 'ADMIN'))
);

create table public.organizer_requests (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    event_type text not null,
    document_path text not null,
    status text not null default 'PENDING',
    admin_comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint organizer_requests_status_check
        check (status in ('PENDING', 'APPROVED', 'REJECTED'))
);

create unique index organizer_requests_one_pending_per_user
    on public.organizer_requests (user_id)
    where status = 'PENDING';

create table public.events (
    id bigint generated always as identity primary key,
    organizer_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text not null,
    event_type text not null,
    event_date timestamptz not null,
    location text not null,
    capacity integer not null,
    price numeric not null default 0,
    status text not null default 'DRAFT',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    currency varchar not null default 'XOF',
    constraint events_capacity_check check (capacity > 0),
    constraint events_price_check check (price >= 0),
    constraint events_status_check
        check (status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'FINISHED'))
);

create table public.reservations (
    id bigint generated always as identity primary key,
    event_id bigint not null references public.events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    quantity integer not null,
    status text not null default 'CONFIRMED',
    created_at timestamptz not null default now(),
    constraint reservations_quantity_check check (quantity > 0),
    constraint reservations_status_check
        check (status in ('PENDING', 'CONFIRMED', 'CANCELLED'))
);

create table public.tickets (
    id bigint generated always as identity primary key,
    reservation_id bigint not null references public.reservations(id) on delete cascade,
    event_id bigint not null references public.events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    ticket_code uuid not null default gen_random_uuid(),
    status text not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    constraint tickets_status_check
        check (status in ('ACTIVE', 'CANCELLED')),
    constraint tickets_ticket_code_key unique (ticket_code)
);

create table public.payments (
    id bigint generated always as identity primary key,
    reservation_id bigint not null references public.reservations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    amount numeric not null,
    currency varchar not null default 'EUR',
    payment_method text not null,
    provider text not null,
    status text not null default 'PENDING',
    provider_payment_id text unique,
    confirmed_by uuid references auth.users(id),
    confirmed_at timestamptz,
    metadata jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint payments_amount_check check (amount > 0),
    constraint payments_payment_method_check
        check (payment_method in ('CARD', 'PAYPAL', 'MOBILE_MONEY', 'ON_SITE')),
    constraint payments_provider_check
        check (provider in ('STRIPE', 'PAYPAL', 'MOBILE_MONEY', 'MANUAL')),
    constraint payments_status_check
        check (status in ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'))
);

alter table public.profiles enable row level security;
alter table public.organizer_requests enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;
alter table public.tickets enable row level security;
alter table public.payments enable row level security;

create policy "Users can read own profile"
    on public.profiles for select to authenticated
    using (auth.uid() = id);

create policy "Users can create own organizer request"
    on public.organizer_requests for insert to authenticated
    with check (auth.uid() = user_id);

create policy "Users can read own organizer requests"
    on public.organizer_requests for select to authenticated
    using (auth.uid() = user_id);

create policy "Admins can read all organizer requests"
    on public.organizer_requests for select to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    ));

create policy "Organizers can create own events"
    on public.events for insert to authenticated
    with check (
        auth.uid() = organizer_id
        and exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'ORGANIZER'
        )
    );

create policy "Organizers can read own events"
    on public.events for select to authenticated
    using (auth.uid() = organizer_id);

create policy "Anyone can read approved events"
    on public.events for select to anon, authenticated
    using (status = 'APPROVED');

create policy "Admins can read all events"
    on public.events for select to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    ));

create policy "Users can read own reservations"
    on public.reservations for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can read own tickets"
    on public.tickets for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can create own payments"
    on public.payments for insert to authenticated
    with check (auth.uid() = user_id);

create policy "Users can read own payments"
    on public.payments for select to authenticated
    using (auth.uid() = user_id);

create policy "Admins can read all payments"
    on public.payments for select to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    ));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name');
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
