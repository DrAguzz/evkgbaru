-- =====================================================================
-- 1. Role helpers
-- =====================================================================

-- Remap legacy roles.
UPDATE public.user_roles SET role = 'customer'   WHERE role = 'tourist';
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'hub_admin'  WHERE role = 'hub_manager';

-- Scope role to a hub (required for hub_admin).
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS hub_id UUID;

-- Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- Helper: is_hub_admin_of(hub)
CREATE OR REPLACE FUNCTION public.is_hub_admin_of(_user_id UUID, _hub_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'hub_admin'
      AND hub_id = _hub_id
  );
$$;

-- Update is_admin to reflect super_admin only going forward (keep legacy admin too).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_hub_admin_of(UUID, UUID) FROM anon;

-- =====================================================================
-- 2. handle_new_user → grant 'customer' role (not 'tourist')
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, nationality)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'nationality'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- Ensure trigger exists on auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 3. Profiles: add extra fields
-- =====================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================================
-- 4. Hubs: add fields for the new spec
-- =====================================================================
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS operating_hours JSONB;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS has_charging BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS has_briefing_area BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS has_checkin_counter BOOLEAN NOT NULL DEFAULT false;

-- Seed the three hubs if empty.
INSERT INTO public.hubs (name, address, status, has_charging, has_briefing_area, has_checkin_counter)
SELECT 'Dataran Merdeka', 'Dataran Merdeka, Kuala Lumpur', 'active', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.hubs WHERE name = 'Dataran Merdeka');
INSERT INTO public.hubs (name, address, status, has_charging, has_briefing_area, has_checkin_counter)
SELECT 'Kampung Baru', 'Kampung Baru, Kuala Lumpur', 'active', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.hubs WHERE name = 'Kampung Baru');
INSERT INTO public.hubs (name, address, status, has_charging, has_briefing_area, has_checkin_counter)
SELECT 'KLCC', 'Kuala Lumpur City Centre', 'active', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.hubs WHERE name = 'KLCC');

-- =====================================================================
-- 5. Vehicle Types
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicle_types TO authenticated;
GRANT ALL ON public.vehicle_types TO service_role;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_types read" ON public.vehicle_types;
CREATE POLICY "vehicle_types read" ON public.vehicle_types
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "vehicle_types super_admin write" ON public.vehicle_types;
CREATE POLICY "vehicle_types super_admin write" ON public.vehicle_types
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

INSERT INTO public.vehicle_types (code, name)
VALUES ('ev_motorcycle', 'EV Motorcycle')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 6. Vehicles (foundation only)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  vehicle_type_id UUID NOT NULL REFERENCES public.vehicle_types(id),
  identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (identifier)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles read scoped" ON public.vehicles;
CREATE POLICY "vehicles read scoped" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), hub_id))
  );
DROP POLICY IF EXISTS "vehicles super_admin write" ON public.vehicles;
CREATE POLICY "vehicles super_admin write" ON public.vehicles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 7. Packages (new, alongside legacy tour_packages)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  vehicle_type_id UUID REFERENCES public.vehicle_types(id) ON DELETE SET NULL,
  max_participants INTEGER NOT NULL DEFAULT 1,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages read" ON public.packages;
CREATE POLICY "packages read" ON public.packages
  FOR SELECT USING (status = 'active' OR public.is_super_admin(auth.uid()) OR (meeting_hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), meeting_hub_id)));
DROP POLICY IF EXISTS "packages super_admin write" ON public.packages;
CREATE POLICY "packages super_admin write" ON public.packages
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "packages hub_admin update" ON public.packages;
CREATE POLICY "packages hub_admin update" ON public.packages
  FOR UPDATE TO authenticated
  USING (meeting_hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), meeting_hub_id))
  WITH CHECK (meeting_hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), meeting_hub_id));

-- =====================================================================
-- 8. Package Time Slots
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.package_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_package_time_slots_package ON public.package_time_slots(package_id);
GRANT SELECT ON public.package_time_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.package_time_slots TO authenticated;
GRANT ALL ON public.package_time_slots TO service_role;
ALTER TABLE public.package_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pts read" ON public.package_time_slots;
CREATE POLICY "pts read" ON public.package_time_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "pts super_admin write" ON public.package_time_slots;
CREATE POLICY "pts super_admin write" ON public.package_time_slots
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "pts hub_admin write" ON public.package_time_slots;
CREATE POLICY "pts hub_admin write" ON public.package_time_slots
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.packages p
    WHERE p.id = package_id
      AND p.meeting_hub_id IS NOT NULL
      AND public.is_hub_admin_of(auth.uid(), p.meeting_hub_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.packages p
    WHERE p.id = package_id
      AND p.meeting_hub_id IS NOT NULL
      AND public.is_hub_admin_of(auth.uid(), p.meeting_hub_id)
  ));

-- =====================================================================
-- 9. Rider Applications
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.rider_application_status AS ENUM (
    'submitted','under_review','interview_scheduled','approved','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.rider_employment_type AS ENUM ('full_time','part_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  ic_passport TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  address TEXT,
  license_number TEXT,
  driving_experience_years INTEGER,
  languages TEXT[] NOT NULL DEFAULT '{}',
  employment_type public.rider_employment_type NOT NULL,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  resume_url TEXT,
  photo_url TEXT,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  declaration_accepted_at TIMESTAMPTZ NOT NULL,
  status public.rider_application_status NOT NULL DEFAULT 'submitted',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  interview_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rider_apps_status ON public.rider_applications(status);
CREATE INDEX IF NOT EXISTS idx_rider_apps_hub ON public.rider_applications(hub_id);
GRANT SELECT, UPDATE ON public.rider_applications TO authenticated;
GRANT INSERT ON public.rider_applications TO anon, authenticated;
GRANT ALL ON public.rider_applications TO service_role;
ALTER TABLE public.rider_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rider_apps insert public" ON public.rider_applications;
CREATE POLICY "rider_apps insert public" ON public.rider_applications
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "rider_apps read admins" ON public.rider_applications;
CREATE POLICY "rider_apps read admins" ON public.rider_applications
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), hub_id))
  );
DROP POLICY IF EXISTS "rider_apps update admins" ON public.rider_applications;
CREATE POLICY "rider_apps update admins" ON public.rider_applications
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), hub_id))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (hub_id IS NOT NULL AND public.is_hub_admin_of(auth.uid(), hub_id))
  );

-- =====================================================================
-- 10. Riders: extend
-- =====================================================================
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS rider_code TEXT UNIQUE;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS employment_type public.rider_employment_type;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.rider_applications(id) ON DELETE SET NULL;

-- Rider code generator
CREATE OR REPLACE FUNCTION public.generate_rider_code(_type public.rider_employment_type)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  prefix TEXT := CASE WHEN _type = 'full_time' THEN 'RT' ELSE 'RP' END;
  candidate TEXT;
  tries INTEGER := 0;
BEGIN
  LOOP
    candidate := prefix
      || '-' || lpad((floor(random()*10000))::int::text, 4, '0')
      || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.riders WHERE rider_code = candidate);
    tries := tries + 1;
    IF tries > 20 THEN RAISE EXCEPTION 'Failed to generate unique rider code'; END IF;
  END LOOP;
  RETURN candidate;
END; $$;

CREATE OR REPLACE FUNCTION public.set_rider_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rider_code IS NULL AND NEW.employment_type IS NOT NULL THEN
    NEW.rider_code := public.generate_rider_code(NEW.employment_type);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_rider_code ON public.riders;
CREATE TRIGGER trg_set_rider_code
  BEFORE INSERT ON public.riders
  FOR EACH ROW EXECUTE FUNCTION public.set_rider_code();

-- =====================================================================
-- 11. user_roles policies for super_admin management
-- =====================================================================
DROP POLICY IF EXISTS "user_roles super_admin write" ON public.user_roles;
CREATE POLICY "user_roles super_admin write" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 12. updated_at trigger for new tables
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  CREATE TRIGGER trg_touch_vehicle_types BEFORE UPDATE ON public.vehicle_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_touch_vehicles BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_touch_packages BEFORE UPDATE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_touch_rider_apps BEFORE UPDATE ON public.rider_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;