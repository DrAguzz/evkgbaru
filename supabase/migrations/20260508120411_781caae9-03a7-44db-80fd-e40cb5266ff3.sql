
-- =========================================================
-- ROLES
-- =========================================================
create type public.app_role as enum ('tourist','rider','hub_manager','admin','super_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  nationality text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id=_user_id and role in ('admin','super_admin')
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone, nationality)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nationality'
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'tourist')
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- DOMAIN TABLES
-- =========================================================
create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude numeric, longitude numeric,
  operating_hour text,
  pic_name text, pic_phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hubs enable row level security;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'checkpoint', -- central_hub | checkpoint | pitstop | return_point
  description text,
  address text,
  latitude numeric, longitude numeric,
  image text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.locations enable row level security;

create table public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  package_name text not null,
  description text,
  duration_minutes int not null default 120,
  price numeric not null default 0,
  min_pax int not null default 1,
  max_pax int not null default 5,
  start_hub_id uuid references public.hubs(id),
  end_hub_id uuid references public.hubs(id),
  image text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tour_packages enable row level security;

create table public.package_routes (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.tour_packages(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  sequence_no int not null,
  estimated_minutes int not null default 15,
  is_checkpoint boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.package_routes enable row level security;

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text,
  hub_id uuid references public.hubs(id),
  vehicle_type text default 'e-bike',
  vehicle_id text,
  status text not null default 'available', -- available|assigned|busy|offline|suspended
  rating numeric not null default 5.0,
  commission_rate numeric not null default 0.20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.riders enable row level security;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no text unique not null default ('BK' || to_char(now(),'YYMMDDHH24MISS') || lpad(floor(random()*1000)::text,3,'0')),
  tourist_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references public.tour_packages(id),
  rider_id uuid references public.riders(id),
  pickup_hub_id uuid references public.hubs(id),
  booking_date date not null,
  booking_time time not null,
  pax int not null default 1,
  total_price numeric not null default 0,
  special_request text,
  payment_status text not null default 'pending', -- pending|paid|failed|refunded|cancelled
  booking_status text not null default 'pending', -- pending|paid|confirmed|assigned|accepted|pickup|in_progress|completed|cancelled|no_show
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_method text not null,
  payment_gateway text default 'mock',
  transaction_id text,
  amount numeric not null,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

create table public.tour_progress (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rider_id uuid references public.riders(id),
  location_id uuid references public.locations(id),
  status text not null,
  sequence_no int not null default 0,
  arrival_time timestamptz,
  remarks text,
  photo text,
  created_at timestamptz not null default now()
);
alter table public.tour_progress enable row level security;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references public.bookings(id) on delete cascade,
  tourist_id uuid not null references auth.users(id) on delete cascade,
  rider_id uuid references public.riders(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text default 'info',
  status text not null default 'unread',
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================
-- profiles
create policy "profiles self read" on public.profiles for select using (auth.uid()=id or public.is_admin(auth.uid()));
create policy "profiles self update" on public.profiles for update using (auth.uid()=id);
create policy "profiles admin all" on public.profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- user_roles
create policy "roles self read" on public.user_roles for select using (auth.uid()=user_id or public.is_admin(auth.uid()));
create policy "roles admin manage" on public.user_roles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- public read for hubs, locations, packages, routes
create policy "hubs read" on public.hubs for select using (true);
create policy "hubs admin write" on public.hubs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "locations read" on public.locations for select using (true);
create policy "locations admin write" on public.locations for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "packages read" on public.tour_packages for select using (true);
create policy "packages admin write" on public.tour_packages for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routes read" on public.package_routes for select using (true);
create policy "routes admin write" on public.package_routes for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- riders: any authenticated user can read (for showing rider info), only admin / self rider can write
create policy "riders read" on public.riders for select using (auth.uid() is not null);
create policy "riders admin write" on public.riders for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "riders self update" on public.riders for update using (auth.uid()=user_id);

-- bookings
create policy "bookings tourist read" on public.bookings for select
  using (auth.uid()=tourist_id or public.is_admin(auth.uid())
         or exists (select 1 from public.riders r where r.id = bookings.rider_id and r.user_id = auth.uid()));
create policy "bookings tourist insert" on public.bookings for insert with check (auth.uid()=tourist_id);
create policy "bookings tourist update" on public.bookings for update
  using (auth.uid()=tourist_id or public.is_admin(auth.uid())
         or exists (select 1 from public.riders r where r.id = bookings.rider_id and r.user_id = auth.uid()));
create policy "bookings admin all" on public.bookings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- payments
create policy "payments read" on public.payments for select
  using (public.is_admin(auth.uid())
         or exists (select 1 from public.bookings b where b.id = payments.booking_id and b.tourist_id = auth.uid()));
create policy "payments tourist insert" on public.payments for insert
  with check (exists (select 1 from public.bookings b where b.id = payments.booking_id and b.tourist_id = auth.uid()));
create policy "payments admin write" on public.payments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- tour_progress
create policy "progress read" on public.tour_progress for select
  using (public.is_admin(auth.uid())
         or exists (select 1 from public.bookings b where b.id = tour_progress.booking_id and b.tourist_id = auth.uid())
         or exists (select 1 from public.riders r where r.id = tour_progress.rider_id and r.user_id = auth.uid()));
create policy "progress rider write" on public.tour_progress for insert
  with check (public.is_admin(auth.uid())
              or exists (select 1 from public.riders r where r.id = tour_progress.rider_id and r.user_id = auth.uid()));
create policy "progress admin update" on public.tour_progress for update using (public.is_admin(auth.uid()));

-- reviews
create policy "reviews read" on public.reviews for select using (true);
create policy "reviews tourist write" on public.reviews for insert with check (auth.uid()=tourist_id);

-- notifications
create policy "notif self read" on public.notifications for select using (auth.uid()=user_id or public.is_admin(auth.uid()));
create policy "notif self update" on public.notifications for update using (auth.uid()=user_id);
create policy "notif admin write" on public.notifications for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
