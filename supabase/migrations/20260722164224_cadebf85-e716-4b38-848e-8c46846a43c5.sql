
-- Break RLS recursion between riders and bookings by using SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION private.is_rider_user(_rider_id uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.riders r
    WHERE r.id = _rider_id AND r.user_id = _user
  );
$$;

CREATE OR REPLACE FUNCTION private.tourist_has_booking_with_rider(_rider_user_id uuid, _tourist uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.riders r ON r.id = b.rider_id
    WHERE r.user_id = _rider_user_id
      AND b.tourist_id = _tourist
  );
$$;

REVOKE ALL ON FUNCTION private.is_rider_user(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tourist_has_booking_with_rider(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_rider_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.tourist_has_booking_with_rider(uuid, uuid) TO authenticated;

-- Recreate riders self read policy without recursive reference to bookings
DROP POLICY IF EXISTS "riders self read" ON public.riders;
CREATE POLICY "riders self read" ON public.riders
FOR SELECT
USING (
  auth.uid() = user_id
  OR private.is_admin(auth.uid())
  OR private.tourist_has_booking_with_rider(riders.user_id, auth.uid())
);

-- Recreate bookings policies without recursive reference to riders
DROP POLICY IF EXISTS "bookings tourist read" ON public.bookings;
CREATE POLICY "bookings tourist read" ON public.bookings
FOR SELECT
USING (
  auth.uid() = tourist_id
  OR private.is_admin(auth.uid())
  OR private.is_rider_user(bookings.rider_id, auth.uid())
);

DROP POLICY IF EXISTS "bookings tourist update" ON public.bookings;
CREATE POLICY "bookings tourist update" ON public.bookings
FOR UPDATE
USING (
  auth.uid() = tourist_id
  OR private.is_admin(auth.uid())
  OR private.is_rider_user(bookings.rider_id, auth.uid())
);
