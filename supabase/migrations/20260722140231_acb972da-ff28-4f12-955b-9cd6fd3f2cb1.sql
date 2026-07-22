
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role in ('admin','super_admin'));
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role='super_admin');
$$;

CREATE OR REPLACE FUNCTION private.is_hub_admin_of(_user_id uuid, _hub_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role='hub_admin' and hub_id=_hub_id);
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_hub_admin_of(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_hub_admin_of(uuid, uuid) TO authenticated, service_role;

-- Rewrite every policy referencing the old helpers
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin all" ON public.profiles;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT USING (auth.uid()=id OR private.is_admin(auth.uid()));
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "roles self read" ON public.user_roles;
DROP POLICY IF EXISTS "roles admin manage" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles super_admin write" ON public.user_roles;
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT USING (auth.uid()=user_id OR private.is_admin(auth.uid()));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "user_roles super_admin write" ON public.user_roles FOR ALL USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "hubs admin write" ON public.hubs;
CREATE POLICY "hubs admin write" ON public.hubs FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "locations admin write" ON public.locations;
CREATE POLICY "locations admin write" ON public.locations FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "packages admin write" ON public.tour_packages;
CREATE POLICY "packages admin write" ON public.tour_packages FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "routes admin write" ON public.package_routes;
CREATE POLICY "routes admin write" ON public.package_routes FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "riders admin write" ON public.riders;
CREATE POLICY "riders admin write" ON public.riders FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "bookings tourist read" ON public.bookings;
DROP POLICY IF EXISTS "bookings tourist update" ON public.bookings;
DROP POLICY IF EXISTS "bookings admin all" ON public.bookings;
CREATE POLICY "bookings tourist read" ON public.bookings FOR SELECT USING (
  auth.uid()=tourist_id OR private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.riders r WHERE r.id=bookings.rider_id AND r.user_id=auth.uid())
);
CREATE POLICY "bookings tourist update" ON public.bookings FOR UPDATE USING (
  auth.uid()=tourist_id OR private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.riders r WHERE r.id=bookings.rider_id AND r.user_id=auth.uid())
);
CREATE POLICY "bookings admin all" ON public.bookings FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "payments read" ON public.payments;
DROP POLICY IF EXISTS "payments admin write" ON public.payments;
CREATE POLICY "payments read" ON public.payments FOR SELECT USING (
  private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id=payments.booking_id AND b.tourist_id=auth.uid())
);
CREATE POLICY "payments admin write" ON public.payments FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "progress read" ON public.tour_progress;
DROP POLICY IF EXISTS "progress rider write" ON public.tour_progress;
DROP POLICY IF EXISTS "progress admin update" ON public.tour_progress;
CREATE POLICY "progress read" ON public.tour_progress FOR SELECT USING (
  private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id=tour_progress.booking_id AND b.tourist_id=auth.uid())
  OR EXISTS (SELECT 1 FROM public.riders r WHERE r.id=tour_progress.rider_id AND r.user_id=auth.uid())
);
CREATE POLICY "progress rider write" ON public.tour_progress FOR INSERT WITH CHECK (
  private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.riders r WHERE r.id=tour_progress.rider_id AND r.user_id=auth.uid())
);
CREATE POLICY "progress admin update" ON public.tour_progress FOR UPDATE USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "notif self read" ON public.notifications;
DROP POLICY IF EXISTS "notif admin write" ON public.notifications;
CREATE POLICY "notif self read" ON public.notifications FOR SELECT USING (auth.uid()=user_id OR private.is_admin(auth.uid()));
CREATE POLICY "notif admin write" ON public.notifications FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "settings admin write" ON public.app_settings;
CREATE POLICY "settings admin write" ON public.app_settings FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "promos admin write" ON public.promo_codes;
CREATE POLICY "promos admin write" ON public.promo_codes FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "splash admin write" ON public.splash_screens;
CREATE POLICY "splash admin write" ON public.splash_screens FOR ALL USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "vehicle_types super_admin write" ON public.vehicle_types;
CREATE POLICY "vehicle_types super_admin write" ON public.vehicle_types FOR ALL USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "vehicles read scoped" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles super_admin write" ON public.vehicles;
CREATE POLICY "vehicles read scoped" ON public.vehicles FOR SELECT USING (
  private.is_super_admin(auth.uid())
  OR (hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), hub_id))
);
CREATE POLICY "vehicles super_admin write" ON public.vehicles FOR ALL USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "rider_apps update admins" ON public.rider_applications;
DROP POLICY IF EXISTS "rider_apps read admins" ON public.rider_applications;
CREATE POLICY "rider_apps update admins" ON public.rider_applications FOR UPDATE USING (
  private.is_super_admin(auth.uid())
  OR (hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), hub_id))
) WITH CHECK (
  private.is_super_admin(auth.uid())
  OR (hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), hub_id))
);
CREATE POLICY "rider_apps read admins" ON public.rider_applications FOR SELECT USING (
  private.is_super_admin(auth.uid())
  OR (hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), hub_id))
);

DROP POLICY IF EXISTS "packages read" ON public.packages;
DROP POLICY IF EXISTS "packages super_admin write" ON public.packages;
DROP POLICY IF EXISTS "packages hub_admin update" ON public.packages;
CREATE POLICY "packages read" ON public.packages FOR SELECT USING (
  status='active'
  OR private.is_super_admin(auth.uid())
  OR (meeting_hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), meeting_hub_id))
);
CREATE POLICY "packages super_admin write" ON public.packages FOR ALL USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "packages hub_admin update" ON public.packages FOR UPDATE USING (
  meeting_hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), meeting_hub_id)
) WITH CHECK (
  meeting_hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), meeting_hub_id)
);

DROP POLICY IF EXISTS "pts super_admin write" ON public.package_time_slots;
DROP POLICY IF EXISTS "pts hub_admin write" ON public.package_time_slots;
CREATE POLICY "pts super_admin write" ON public.package_time_slots FOR ALL USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "pts hub_admin write" ON public.package_time_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_time_slots.package_id AND p.meeting_hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), p.meeting_hub_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_time_slots.package_id AND p.meeting_hub_id IS NOT NULL AND private.is_hub_admin_of(auth.uid(), p.meeting_hub_id))
);

-- Storage app-assets admin policies
DROP POLICY IF EXISTS "app-assets admin write" ON storage.objects;
DROP POLICY IF EXISTS "app-assets admin update" ON storage.objects;
DROP POLICY IF EXISTS "app-assets admin delete" ON storage.objects;
CREATE POLICY "app-assets admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='app-assets' AND private.is_admin(auth.uid()));
CREATE POLICY "app-assets admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='app-assets' AND private.is_admin(auth.uid()))
  WITH CHECK (bucket_id='app-assets' AND private.is_admin(auth.uid()));
CREATE POLICY "app-assets admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='app-assets' AND private.is_admin(auth.uid()));

-- Drop old public helpers and risky claim_* functions
DROP FUNCTION IF EXISTS public.claim_admin_role();
DROP FUNCTION IF EXISTS public.claim_rider_profile();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.is_hub_admin_of(uuid, uuid);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Restrict riders SELECT
DROP POLICY IF EXISTS "riders read" ON public.riders;
DROP POLICY IF EXISTS "riders self read" ON public.riders;
CREATE POLICY "riders self read" ON public.riders FOR SELECT USING (
  auth.uid() = user_id
  OR private.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.rider_id = riders.id AND b.tourist_id = auth.uid())
);

-- Reviews signed-in only
DROP POLICY IF EXISTS "reviews read" ON public.reviews;
CREATE POLICY "reviews read" ON public.reviews FOR SELECT TO authenticated USING (true);

-- Stop broad listing of public buckets; public URLs still serve individual files
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "app-assets public read" ON storage.objects;
