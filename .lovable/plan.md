# Phase 4 — Administration, Reports & Settings

This phase completes the admin backbone without touching auth, DB structure, roles, booking flow, or ride ops built earlier. Most CRUD modules (Packages, Riders, Rider Applications, Customers, Bookings, Payments, Hubs, Vehicle Types, Hub Admins, Splash, Promo, Check-in, Trips, SOS) already exist — this phase adds the missing high-level pieces and unifies UX.

## 1. Role-aware dashboards
- `/admin` — rebuilt shell.
  - **Super Admin view**: KPI cards (Customers, Riders, Hub Admins, Hubs, Packages, Today's Bookings, Active Trips, Completed Trips, Waiting List, Total Revenue, Monthly Revenue), Popular Packages (top 5 by booking count), Top Riders (top 5 by completed trips + avg rating), 30-day revenue sparkline, live "System pulse" section (recent SOS + waiting list).
  - **Hub Admin view**: scoped to their hub(s). Cards for Today's Bookings, Active Trips, Completed Trips, Available Riders, Busy Riders, Waiting List, Check-ins pending, Daily Revenue; Hub performance chart (last 7 days bookings/revenue).
- All numbers come from parallel Supabase counts + a single SQL view for revenue rollups (added via migration, read-only).

## 2. Reports module (`/admin/reports`)
Single page with report type selector + date range picker + hub filter (super admin only).
Report types: Daily / Weekly / Monthly Bookings, Revenue, Package Performance, Rider Performance, Hub Performance, Payment Summary, Waiting List, Customer Ratings.
Renders a table preview + summary tiles.
Export buttons:
- **CSV** — client-side.
- **Excel (.xlsx)** — client-side via `xlsx` package.
- **PDF** — client-side via `jspdf` + `jspdf-autotable` with EV Kg Baru header.

## 3. System settings (`/admin/settings`) — Super Admin only
Extend the existing `app_settings` row (already used for splash) with grouped controls:
- Pickup rate (RM/km), free-pickup radius.
- Cancellation window (hours), cancellation fee %.
- Waiting-list response minutes, auto-expire minutes.
- Default booking slot length, hub operating hours override note.
- Payment methods enabled (toggle FPX, card, e-wallet, cash on arrival).
- Notification channels enabled (in-app, email, SMS placeholder).

All persisted to `app_settings`; migration adds only new nullable columns (no destructive DB change).

## 4. Audit log (`/admin/audit`)
- New `audit_logs` table (id, user_id, actor_role, action, entity, entity_id, metadata jsonb, ip, user_agent, created_at). RLS: super_admin read-all; hub_admin read own hub scope; insert allowed for authenticated.
- Helper `logAudit()` wired into: sign-in/out, booking status change, rider assign/unassign, payment verify, package activate/deactivate, settings update, rider approve/reject.
- Admin page: searchable + filterable list with pagination.

## 5. Notifications center (`/admin/notifications-center`)
Overview of system notification templates (read-only list of the notification types produced by the system) + toggle master switches per type (stored in `app_settings`). Existing user-facing `/app/notifications` is untouched.

## 6. Payment management enhancements
Existing payments page gains: search, date filter, "verify payment" action for manual/bank transfers (moves `payment_status → paid`, triggers rider auto-assign like the current mock flow), CSV/Excel export.

## 7. Admin shell polish
- Sidebar grouped: **Operations** (Dashboard, Check-in, Trips, SOS, Bookings, Waiting List) · **Catalog** (Packages, Hubs, Vehicle Types) · **People** (Riders, Rider Applications, Customers, Hub Admins) · **Finance** (Payments, Promo Codes) · **Insights** (Reports, Audit Log) · **System** (Settings, Splash, Notifications).
- Collapsible sections, responsive mobile drawer, consistent page header component (title/subtitle/actions) reused across all admin pages.

## 8. Performance & housekeeping
- Add DB indexes: `bookings(booking_date, pickup_hub_id)`, `bookings(rider_id, booking_date)`, `payments(created_at)`, `audit_logs(created_at desc)`.
- Wrap all admin lists in server-paginated queries (25/page).
- Remove legacy `/admin/users` split by folding into a single `/admin/customers` and `/admin/hub-admins` (already exists) — old file replaced with a redirect.

## 9. Future-expansion readiness (structural only, no new features)
- `hubs` already has state/city columns; ensure admin filters expose them.
- Add nullable `vehicle_class` on `vehicle_types` (bike/car) for future EV cars — no UI change beyond a dropdown option.
- Add nullable `category` (`tour|food|shopping|corporate|group`) surface on packages filter — schema already supports it.
- Add `language` (default `en`) column on `profiles` for future i18n. No translation work in this phase.

## Technical notes

### New / changed files
- `src/routes/admin.index.tsx` (rebuild)
- `src/routes/admin.reports.tsx` (new)
- `src/routes/admin.settings.tsx` (extend)
- `src/routes/admin.audit.tsx` (new)
- `src/routes/admin.notifications-center.tsx` (new)
- `src/routes/admin.payments.tsx` (extend with verify + export)
- `src/routes/admin.tsx` (sidebar restructure)
- `src/components/AdminPageHeader.tsx` (new shared)
- `src/lib/audit.ts` (new helper) + call sites in existing admin actions
- `src/lib/reports.ts` (aggregation helpers)
- `src/lib/export.ts` (CSV/Excel/PDF)

### Packages to add
`xlsx`, `jspdf`, `jspdf-autotable`, `recharts` (already present — reuse).

### Migrations (additive only)
1. `audit_logs` table with RLS + grants.
2. New nullable columns on `app_settings`: `cancellation_hours`, `cancellation_fee_pct`, `waiting_expire_minutes`, `payment_methods jsonb`, `notification_channels jsonb`, `notification_types jsonb`, `free_pickup_km`.
3. New nullable columns: `vehicle_types.vehicle_class`, `profiles.language`.
4. Indexes listed under section 8.

### Non-goals for this phase
- No changes to auth flows, `user_roles`, booking state machine, or rider check-in/SOS logic.
- No real translation, no real SMS/email delivery (channels are toggles surfaced in settings only).
- No new customer-facing screens.

### Verification
- Typecheck (`bunx tsgo --noEmit`).
- Manually walk each admin page as super_admin and hub_admin; confirm scoped data.
- Export each report format once and open the generated file.
