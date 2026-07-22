## Situasi

- Akaun demo rider: `demo.rider@evride.test` ✅ sudah wujud
- Hub: **Kg Baru Hub** ✅ sudah di-assign (disahkan via query DB)
- Rekod `riders` lengkap (rider_code, employment_type, license_type) ✅

Jadi data sudah betul. Skrin "Become a Rider" masih muncul kerana **bug RLS**, bukan data.

## Punca sebenar (disahkan)

Query `supabase.from("riders").select("id").eq("user_id", user.id)` dari client return HTTP 500:

```
infinite recursion detected in policy for relation "riders"
```

Dua polisi saling merujuk:
- `riders` SELECT policy → `EXISTS (SELECT FROM bookings WHERE ...)`
- `bookings` SELECT/UPDATE policy → `EXISTS (SELECT FROM riders WHERE ...)`

Client tak dapat baca rider row sendiri → `riderId = null` → fallback ke skrin "Become a Rider".

## Pembetulan (migration sahaja, tiada perubahan frontend)

1. Cipta helper SECURITY DEFINER dalam schema `private` (ikut corak `private.is_admin` sedia ada):
   - `private.is_rider_user(_rider_id uuid, _user uuid)` — cek sama ada `rider_id` tertentu adalah milik `_user`. Bypass RLS.
   - `private.tourist_has_booking_with_rider(_rider_user_id uuid, _tourist uuid)` — cek sama ada tourist ada booking dengan rider ini. Bypass RLS.
2. Grant EXECUTE kepada `authenticated`.
3. `DROP POLICY "riders self read" ON public.riders` → cipta semula:
   ```
   USING (auth.uid() = user_id
          OR private.is_admin(auth.uid())
          OR private.tourist_has_booking_with_rider(riders.user_id, auth.uid()))
   ```
4. `DROP POLICY "bookings tourist read"` & `"bookings tourist update"` ON `public.bookings` → cipta semula guna `private.is_rider_user(bookings.rider_id, auth.uid())` ganti sub-query `riders`.

Selepas migration: query rider self-read berjaya → dashboard rider terbuka betul selepas klik **Try Demo Rider account**.
