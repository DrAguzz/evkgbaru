## Objective

Hapuskan kebergantungan Demo Account pada `SUPABASE_SERVICE_ROLE_KEY`. Fungsi admin lain (Hub Admin & Rider creation) kekal tak berubah.

## Perubahan

### 1. `src/routes/auth.tsx`
- Buang import `ensureDemoUser`.
- Untuk butang Demo (Hub Admin, Super Admin):
  - Terus panggil `signIn(email, "demo1234")` dengan email tetap:
    - `demo.hub@evride.test`
    - `demo.super@evride.test`
  - Jika `signIn` pulangkan error (contoh `Invalid login credentials`), papar toast: **"Demo account tidak wujud. Sila hubungi administrator."**
  - Buang sebarang logik cipta akaun.

### 2. `src/components/AppAuth.tsx`
- Butang "Try Demo Rider account" (dan demo customer jika ada) ditukar sama:
  - `signInWithPassword` guna `demo.rider@evride.test` / `demo.customer@evride.test` dengan password `demo1234`.
  - Jika gagal, papar mesej "Demo account tidak wujud. Sila hubungi administrator."
- Buang panggilan `ensureDemoUser`.

### 3. Padam fail
- `src/lib/demo-login.functions.ts` (padam sepenuhnya).

### 4. Kekal tanpa perubahan
- `src/integrations/supabase/client.server.ts` — masih diperlukan oleh `admin-users.functions.ts` & `rider-admin.functions.ts`.
- `src/lib/admin-users.functions.ts`, `src/lib/rider-admin.functions.ts` — tak disentuh.
- Env var `SUPABASE_SERVICE_ROLE_KEY` masih perlu di Vercel **hanya** untuk fungsi admin tersebut; namun Demo Account flow sudah tak lagi bergantung padanya (butang Demo akan berfungsi walaupun service role tiada, selagi akaun demo sudah wujud di database).

## Nota

Akaun demo (`demo.hub@evride.test`, `demo.super@evride.test`, `demo.rider@evride.test`, `demo.customer@evride.test`) sudah wujud dalam pangkalan data dari sesi sebelumnya, jadi butang demo akan terus berfungsi dengan `signInWithPassword` selepas refactor.
