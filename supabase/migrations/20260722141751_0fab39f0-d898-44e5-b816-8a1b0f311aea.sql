
-- Check-ins (Hub admin verifies at hub)
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  verified_by uuid REFERENCES auth.users(id),
  payment_verified boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  identity_document text,
  notes text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "check-ins admin manage" ON public.check_ins
  FOR ALL TO authenticated
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "check-ins customer read" ON public.check_ins
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = check_ins.booking_id AND b.tourist_id = auth.uid()));

-- Safety briefings
CREATE TABLE public.safety_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  briefed_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'completed',
  briefing_time timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_briefings TO authenticated;
GRANT ALL ON public.safety_briefings TO service_role;
ALTER TABLE public.safety_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefings admin manage" ON public.safety_briefings
  FOR ALL TO authenticated
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "briefings customer read" ON public.safety_briefings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = safety_briefings.booking_id AND b.tourist_id = auth.uid()));

-- SOS alerts
CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tourist_id uuid NOT NULL,
  rider_id uuid REFERENCES public.riders(id),
  latitude numeric,
  longitude numeric,
  message text,
  emergency_contact text,
  status text NOT NULL DEFAULT 'open',
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos admin manage" ON public.sos_alerts
  FOR ALL TO authenticated
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "sos customer own" ON public.sos_alerts
  FOR ALL TO authenticated
  USING (tourist_id = auth.uid())
  WITH CHECK (tourist_id = auth.uid());
CREATE POLICY "sos rider read" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_briefings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
