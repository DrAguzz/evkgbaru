
-- Extend app_settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS cancellation_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS cancellation_fee_pct integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS waiting_expire_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS free_pickup_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_slot_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS operating_hours_note text,
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '{"fpx":true,"card":true,"ewallet":true,"cash":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_channels jsonb NOT NULL DEFAULT '{"inapp":true,"email":false,"sms":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_types jsonb NOT NULL DEFAULT '{"booking_confirmed":true,"payment_success":true,"payment_failed":true,"rider_assigned":true,"booking_reminder":true,"waiting_list_promotion":true,"ride_completed":true,"sos_alert":true}'::jsonb;

-- Future expansion columns
ALTER TABLE public.vehicle_types ADD COLUMN IF NOT EXISTS vehicle_class text NOT NULL DEFAULT 'bike';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  hub_id uuid REFERENCES public.hubs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit self insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "audit admin read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date_hub ON public.bookings(booking_date, pickup_hub_id);
CREATE INDEX IF NOT EXISTS idx_bookings_rider_date ON public.bookings(rider_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity, entity_id);
