
-- 1. Add new columns
ALTER TABLE public.tour_packages
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'City',
  ADD COLUMN IF NOT EXISTS is_promo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percentage integer;

CREATE INDEX IF NOT EXISTS tour_packages_category_idx ON public.tour_packages (category);
CREATE INDEX IF NOT EXISTS tour_packages_is_promo_idx ON public.tour_packages (is_promo);

-- 2. Backfill existing
UPDATE public.tour_packages SET category = 'Heritage' WHERE id = '33333333-0000-0000-0000-000000000001';
UPDATE public.tour_packages SET category = 'Food'     WHERE id = '33333333-0000-0000-0000-000000000002';
UPDATE public.tour_packages SET category = 'City'     WHERE id = '33333333-0000-0000-0000-000000000003';

-- 3. Seed extra packages per category (idempotent on package_name)
INSERT INTO public.tour_packages (package_name, description, price, duration_minutes, image, category, status, min_pax, max_pax, is_promo, promo_price, discount_percentage)
VALUES
  ('National Monument Trail', 'Ride along Lake Gardens to the National Monument and surrounding heritage sites.', 110, 100, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Heritage', 'active', 1, 5, false, NULL, NULL),
  ('Masjid Negara & Museum Tour', 'Visit Masjid Negara, the National Museum and Old KL Railway Station.', 130, 120, 'https://images.unsplash.com/photo-1605649461784-7c1c0f5d3b1e?w=1200', 'Heritage', 'active', 1, 5, false, NULL, NULL),
  ('Chow Kit Street Food Ride', 'Sample street food favourites around bustling Chow Kit market.', 95, 90, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200', 'Food', 'active', 1, 5, false, NULL, NULL),
  ('Local Breakfast Trail', 'Morning ride through nasi lemak, roti canai and kopitiam favourites.', 80, 75, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200', 'Food', 'active', 1, 5, false, NULL, NULL),
  ('Night Food Ride', 'After-dark food adventure across KL''s most popular night spots.', 100, 90, 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200', 'Food', 'active', 1, 5, true, 79, 21),
  ('KL City Highlights Ride', 'Hit the major KL highlights — KLCC, Bukit Bintang and Merdeka 118.', 140, 120, 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200', 'City', 'active', 1, 5, false, NULL, NULL),
  ('KLCC Skyline Ride', 'Cruise around the Petronas Twin Towers and KLCC park skyline route.', 120, 90, 'https://images.unsplash.com/photo-1596178060810-72660ee79074?w=1200', 'City', 'active', 1, 5, true, 99, 18),
  ('Urban Discovery Ride', 'A relaxed urban discovery loop through KL''s liveliest neighbourhoods.', 110, 100, 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=1200', 'City', 'active', 1, 5, false, NULL, NULL),
  ('City Night Ride', 'See the city lights from the saddle on a guided night ride.', 130, 110, 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=1200', 'City', 'active', 1, 5, true, 109, 16),
  ('First Ride Promo', 'Welcome offer — get a discounted intro ride around heritage KL.', 150, 120, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200', 'Heritage', 'active', 1, 5, true, 99, 34),
  ('Weekend Ride Deal', 'Special weekend pricing for any KL city ride.', 120, 100, 'https://images.unsplash.com/photo-1517242810446-cc8951b2be40?w=1200', 'City', 'active', 1, 5, true, 89, 26),
  ('Group Ride Discount', 'Bring your friends — discounted price for groups of 3+.', 110, 100, 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200', 'City', 'active', 1, 5, true, 85, 23),
  ('Early Bird Promo', 'Book a sunrise ride and save — limited slots daily.', 100, 90, 'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=1200', 'Heritage', 'active', 1, 5, true, 75, 25)
ON CONFLICT DO NOTHING;
