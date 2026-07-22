# Phase 1 Redesign: Foundation, RBAC, Hubs, Packages, Rider Onboarding

Scope for this phase only: database redesign, authentication, role-based access, dashboards shells, navigation, and master data (Hubs, Packages, Vehicle Types, Rider Applications). Booking flow, payments, waitlists, SOS, and reports are out of scope and come in later phases.

## 1. Roles & RBAC

Replace the current `app_role` enum with 4 roles: `super_admin`, `hub_admin`, `rider`, `customer`.

- `user_roles` keeps `(user_id, role)` and adds nullable `hub_id` (required for `hub_admin`, optional scoping for `rider`).
- Security-definer helpers:
  - `has_role(uid, role)` — existing pattern.
  - `is_super_admin(uid)`, `is_hub_admin_of(uid, hub_id)`, `current_hub_ids(uid)` — used in RLS.
- Customers get the `customer` role automatically on signup (trigger replaces current `tourist` default).
- Hub Admins and Riders are created by Super Admin only; public signup grants `customer` only.

## 2. Authentication

Keep Supabase auth. Public flows:

- Customer Register / Login / Forgot Password / Reset Password / Email Verification.
- Hub Admin and Rider login only (no self-register). Attempted signup with those emails is blocked at the app level.
- Add `/auth/reset-password` and `/auth/verify` routes; wire email redirect URLs.
- Session-aware redirects: customers → `/app`, riders → `/rider`, hub_admin → `/admin` (scoped), super_admin → `/admin`.

## 3. Database Redesign

New / revised tables (all in `public`, RLS enabled, GRANTs included per project standard):

- `hubs` — rebuilt: name, address, gps lat/lng, operating_hours (jsonb), max_capacity, has_charging, has_briefing_area, has_checkin_counter, status.
- `vehicle_types` — new: code (`ev_motorcycle`, `ev_car`, …), name, active. Seed EV Motorcycle.
- `vehicles` — new (foundation only): hub_id, vehicle_type_id, plate/identifier, status. No booking wiring yet.
- `packages` — rebuilt from `tour_packages`: name, slug, description, price, duration_minutes, meeting_hub_id, vehicle_type_id, max_participants, images (jsonb), status. Time slots in child table `package_time_slots` (day_of_week, start_time, end_time).
- `rider_applications` — new: personal info, IC/passport, DOB, gender, address, license #, experience, languages (text[]), employment_type (`full_time` | `part_time`), resume_url, photo_url, documents (jsonb), declaration_accepted_at, status (`submitted` | `under_review` | `interview_scheduled` | `approved` | `rejected`), reviewer_id, review_notes.
- `riders` — rebuilt: user_id, application_id, hub_id, rider_code (auto `RT-XXXX-XXXX` full-time / `RP-XXXX-XXXX` part-time via DB function + trigger), employment_type, status.
- `profiles` — keep, extend with avatar_url, dob, gender, address.
- `notifications` — keep, generalize to any role.

Legacy tables (`bookings`, `payments`, `tour_progress`, `reviews`, `promo_codes`, `package_routes`, `splash_screens`, `app_settings`, `locations`) are preserved as-is this phase; unused UI is hidden but data isn't dropped. Booking-related tables will be redesigned in Phase 2.

RLS summary:

- `hubs`, `vehicle_types`, `packages`: public read (active only for anon/customer), write = super_admin; hub_admin can edit packages whose `meeting_hub_id` matches their hub.
- `rider_applications`: insert = anyone (public form), select/update = super_admin + hub_admin of target hub, applicant can read own by email token.
- `riders`: select for super_admin, hub_admin of same hub, and the rider themselves. Writes = super_admin (assignments) + rider (own profile fields).
- `user_roles`: read own; writes = super_admin only.
- `profiles`: read/write own; super_admin/hub_admin can read profiles of users tied to their scope.

## 4. Navigation & Dashboards

Route reshape:

```text
/                       public landing
/auth/*                 login, register, forgot, reset, verify
/become-a-rider         public application form
/app/*                  customer app (existing shell)
/rider/*                rider app (gated to approved riders)
/admin/*                super_admin + hub_admin (scoped)
```

Admin shell (`src/routes/admin.tsx`) gets a role-aware sidebar:

- Super Admin sees: Dashboard, Hubs, Hub Admins, Riders, Rider Applications, Customers, Packages, Vehicle Types, Settings.
- Hub Admin sees: Dashboard (their hub), Riders (their hub), Rider Applications (their hub), Customers (their hub), Packages (their hub). All queries filtered by `hub_id`.
- Booking, Payments, Reports links hidden this phase (kept in code for Phase 2).

New admin pages (shells + master-data CRUD only):

- `admin.hubs.tsx` (rebuild for new schema)
- `admin.vehicle-types.tsx`
- `admin.hub-admins.tsx` — create hub admin, assign to one hub
- `admin.rider-applications.tsx` — list, filter by status, view detail, set status, approve → creates auth user + rider record + sends invite
- `admin.riders.tsx` — list/edit riders, change employment type or hub
- `admin.packages.tsx` (rebuild for new schema + time slots UI)
- `admin.index.tsx` — dashboard cards scoped to role/hub (counts only this phase)

Rider portal: login + placeholder dashboard ("Assigned Jobs coming soon"), profile edit, SOS button UI (non-functional this phase). Customer app keeps current browse/profile; booking CTAs are disabled with "Coming soon" until Phase 2.

## 5. Become a Rider (public)

New `/become-a-rider` route with the full application form, file uploads to `app-assets` bucket, writes to `rider_applications` with status `submitted`. Confirmation screen. No account created.

## 6. Approval Flow

In `admin.rider-applications.tsx`:

1. Review → set `under_review`.
2. Schedule interview → set `interview_scheduled` (notes field).
3. Approve → server function: create auth user (invite email), insert `riders` row (auto-generated code), grant `rider` role scoped to hub.
4. Reject → set `rejected` with reason.

All done via `createServerFn` with `requireSupabaseAuth` + admin role check, using `supabaseAdmin` inside the handler.

## Technical details

- Migrations run in order: enum rewrite → helper functions → tables → GRANTs → RLS → policies → triggers (updated_at, rider code generator, customer role on signup).
- Rider code generator: PL/pgSQL function using `RT-` or `RP-` prefix + zero-padded random 8 hex chars, retry on unique conflict.
- Server functions live in `src/lib/*.functions.ts`; admin-only ones assert role via `has_role` before importing `supabaseAdmin` inside the handler.
- Route guards: `_authenticated` layout already handles auth. Add per-route `beforeLoad` role checks that redirect unauthorized users to their home.
- Keep existing profiles/user_roles data; migrate `tourist` → `customer`, existing `admin` → `super_admin`.

## Out of scope (later phases)

- Booking creation, waiting list, check-in, rider assignment, trip status.
- Payments and insurance.
- SOS delivery, notifications delivery.
- Reports and analytics.
- Customer-facing package browsing redesign beyond what's needed to reflect the new schema.
