CREATE TABLE public.splash_screens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text,
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.splash_screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "splash read" ON public.splash_screens FOR SELECT USING (true);
CREATE POLICY "splash admin write" ON public.splash_screens FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_splash_sort ON public.splash_screens (sort_order);