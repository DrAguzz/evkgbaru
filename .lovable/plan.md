
## Punca

Butang **Demo Account** memanggil server function `ensureDemoUser` (`src/lib/demo-login.functions.ts`) yang guna `supabaseAdmin`. Client admin ni perlukan dua env var pada runtime pelayan:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Di Lovable Cloud kedua-duanya di-inject automatik. Di Vercel tak — jadi `client.server.ts` throw *"Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"* — mesej yang awak nampak.

Selain tu, `SUPABASE_PUBLISHABLE_KEY` juga diperlukan oleh middleware auth pada SSR (fallback untuk `requireSupabaseAuth`).

## Nota penting

Nilai `SUPABASE_SERVICE_ROLE_KEY` **tidak tersedia** melalui Lovable Cloud UI — hanya awak (pemilik projek Supabase) yang boleh dapatkan. Lovable tak boleh ambilkan untuk awak.

## Langkah pembetulan

1. Awak buka Vercel Project → **Settings → Environment Variables**, tambah untuk semua environment (Production, Preview, Development):
   - `SUPABASE_URL` = `https://uypacmbjbpcnhaonitie.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = (sama dengan `VITE_SUPABASE_PUBLISHABLE_KEY` yang sedia ada dalam `.env`)
   - `SUPABASE_SERVICE_ROLE_KEY` = ambil dari Supabase Dashboard → Project Settings → API → `service_role` key (jangan dedah kepada sesiapa)
2. Redeploy projek Vercel supaya env vars baru dimuat.

## Pilihan tambahan (opsyenal)

- Kalau nak elak masalah ni dan awak OK guna hosting Lovable sebagai production, teruskan guna Lovable Cloud (env auto). Demo login tetap berfungsi tanpa setup tambahan.
- Kalau nak keep Vercel, tiada perubahan kod diperlukan — hanya konfigurasi env di Vercel.

## Tiada perubahan kod

Plan ini tak sentuh fail kod. Semua tindakan ada di sisi Vercel/Supabase dashboard.
