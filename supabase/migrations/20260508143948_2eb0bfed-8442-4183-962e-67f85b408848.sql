ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_tourist_profile_fkey
  FOREIGN KEY (tourist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;