
-- App settings (singleton)
create table if not exists public.app_settings (
  id int primary key default 1,
  splash_image_url text,
  splash_title text default 'EVRide',
  splash_subtitle text default 'Explore KL on electric bikes',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict do nothing;
alter table public.app_settings enable row level security;
create policy "settings read" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Promo codes
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage', -- 'percentage' | 'fixed'
  discount_value numeric not null default 0,
  min_amount numeric not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
create policy "promos read" on public.promo_codes for select using (true);
create policy "promos admin write" on public.promo_codes for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Add promo info to bookings
alter table public.bookings
  add column if not exists promo_code text,
  add column if not exists discount_amount numeric not null default 0;

-- Public bucket for app assets (splash etc)
insert into storage.buckets (id, name, public) values ('app-assets','app-assets', true) on conflict do nothing;
create policy "app-assets public read" on storage.objects for select using (bucket_id = 'app-assets');
create policy "app-assets admin write" on storage.objects for insert with check (bucket_id = 'app-assets' and public.is_admin(auth.uid()));
create policy "app-assets admin update" on storage.objects for update using (bucket_id = 'app-assets' and public.is_admin(auth.uid()));
create policy "app-assets admin delete" on storage.objects for delete using (bucket_id = 'app-assets' and public.is_admin(auth.uid()));
