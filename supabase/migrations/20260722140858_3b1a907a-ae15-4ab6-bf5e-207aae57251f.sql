
-- Backfill legacy statuses
UPDATE public.bookings SET booking_status='pending_payment' WHERE booking_status='pending';
UPDATE public.bookings SET booking_status='rider_assigned' WHERE booking_status='assigned';
UPDATE public.bookings SET booking_status='ride_started' WHERE booking_status='in_progress';
UPDATE public.bookings SET booking_status='ride_completed' WHERE booking_status='completed';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hub_id uuid REFERENCES public.hubs(id),
  ADD COLUMN IF NOT EXISTS vehicle_type_id uuid REFERENCES public.vehicle_types(id),
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id),
  ADD COLUMN IF NOT EXISTS time_slot_id uuid REFERENCES public.package_time_slots(id),
  ADD COLUMN IF NOT EXISTS meeting_method text NOT NULL DEFAULT 'walk_in',
  ADD COLUMN IF NOT EXISTS pickup_location_name text,
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS pickup_latitude numeric,
  ADD COLUMN IF NOT EXISTS pickup_longitude numeric,
  ADD COLUMN IF NOT EXISTS pickup_distance_km numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_time time,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_policy_no text,
  ADD COLUMN IF NOT EXISTS insurance_coverage_date date,
  ADD COLUMN IF NOT EXISTS insurance_status text;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_status_check
  CHECK (booking_status IN (
    'pending_payment','payment_failed','paid','waiting_rider_assignment',
    'rider_assigned','customer_checked_in','safety_briefing_completed',
    'ride_started','ride_completed','cancelled','no_show'
  ));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_meeting_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_meeting_method_check
  CHECK (meeting_method IN ('walk_in','hotel_pickup'));

ALTER TABLE public.package_time_slots
  ADD COLUMN IF NOT EXISTS capacity int NOT NULL DEFAULT 4;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_reference text UNIQUE,
  ADD COLUMN IF NOT EXISTS provider_txn_id text;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS pickup_rate_per_km numeric NOT NULL DEFAULT 1.50,
  ADD COLUMN IF NOT EXISTS waiting_list_response_minutes int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_insurance_provider text NOT NULL DEFAULT 'EV Kg Baru Daily Cover';

CREATE TABLE IF NOT EXISTS public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  time_slot_id uuid NOT NULL REFERENCES public.package_time_slots(id) ON DELETE CASCADE,
  pax int NOT NULL DEFAULT 1,
  queue_number int NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','confirmed','expired','cancelled')),
  notified_at timestamptz,
  respond_by timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiting_list TO authenticated;
GRANT ALL ON public.waiting_list TO service_role;
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waiting_list self read" ON public.waiting_list FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR private.has_role(auth.uid(),'super_admin') OR private.has_role(auth.uid(),'hub_admin'));
CREATE POLICY "waiting_list self insert" ON public.waiting_list FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "waiting_list self update" ON public.waiting_list FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR private.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER waiting_list_updated BEFORE UPDATE ON public.waiting_list
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.assert_slot_capacity()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  slot_cap int;
  used int;
BEGIN
  IF NEW.time_slot_id IS NULL OR NEW.booking_status IN ('cancelled','no_show','payment_failed') THEN
    RETURN NEW;
  END IF;
  SELECT capacity INTO slot_cap FROM public.package_time_slots WHERE id = NEW.time_slot_id;
  IF slot_cap IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(SUM(pax),0) INTO used FROM public.bookings
    WHERE time_slot_id = NEW.time_slot_id
      AND booking_date = NEW.booking_date
      AND id <> NEW.id
      AND booking_status NOT IN ('cancelled','no_show','payment_failed');
  IF used + NEW.pax > slot_cap THEN
    RAISE EXCEPTION 'Slot is full (capacity % / used %)', slot_cap, used;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assert_slot_capacity ON public.bookings;
CREATE TRIGGER trg_assert_slot_capacity BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.assert_slot_capacity();

CREATE OR REPLACE FUNCTION public.promote_waiting_list()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  wl RECORD;
  resp_min int;
BEGIN
  IF NEW.booking_status IN ('cancelled','no_show') AND OLD.booking_status <> NEW.booking_status THEN
    SELECT waiting_list_response_minutes INTO resp_min FROM public.app_settings LIMIT 1;
    resp_min := COALESCE(resp_min, 30);
    SELECT * INTO wl FROM public.waiting_list
      WHERE package_id = NEW.package_id
        AND booking_date = NEW.booking_date
        AND time_slot_id = NEW.time_slot_id
        AND status = 'waiting'
      ORDER BY queue_number ASC LIMIT 1;
    IF FOUND THEN
      UPDATE public.waiting_list
        SET status='notified', notified_at=now(), respond_by=now() + (resp_min || ' minutes')::interval
        WHERE id = wl.id;
      INSERT INTO public.notifications(user_id,title,message,type,status)
        VALUES (wl.customer_id,'A slot opened up!',
          'A spot is now available for your waiting list booking. Confirm within ' || resp_min || ' minutes.',
          'waiting_list_promotion','unread');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_promote_waiting_list ON public.bookings;
CREATE TRIGGER trg_promote_waiting_list AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.promote_waiting_list();
