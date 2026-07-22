
## Scope

Rebuild the customer side of the booking system end-to-end. Auth, roles, rider ops, and admin dashboards are untouched. Deliverables target the `/app/*` customer journey plus the database, notifications, and payment plumbing behind it.

## 1. Database changes (single migration)

**Extend `bookings`** with:
- `hub_id` (redundant with package hub but locks the value at booking time)
- `vehicle_type_id`, `vehicle_id` (nullable until rider assignment)
- `time_slot_id` (FK → package_time_slots)
- `meeting_method` text: `walk_in` | `hotel_pickup`
- `pickup_location_name`, `pickup_address`, `pickup_latitude`, `pickup_longitude`, `pickup_distance_km`, `pickup_fee` (numeric, default 0), `pickup_time`
- `notes` text (customer notes, separate from `special_request`)
- `insurance_provider`, `insurance_policy_no`, `insurance_coverage_date`, `insurance_status`
- Rewrite `booking_status` check constraint to the 11 statuses in the brief (pending_payment, payment_failed, paid, waiting_rider_assignment, rider_assigned, customer_checked_in, safety_briefing_completed, ride_started, ride_completed, cancelled, no_show).

**Extend `package_time_slots`** so slots are date-specific enough to enforce capacity:
- Add `capacity` int (defaults from `packages.max_participants`)
- Keep the weekly `day_of_week` recurrence; capacity is enforced per (slot_id, booking_date) via a `SELECT count(*)` against confirmed bookings.

**New `waiting_list` table**: customer_id, package_id, booking_date, time_slot_id, queue_number, status (`waiting` | `notified` | `confirmed` | `expired` | `cancelled`), notified_at, respond_by, created_at. Queue number auto-incremented per (package, date, slot).

**Extend `payments`** with: `payment_reference` (unique), `payment_method` (`chip_in` | `alipay` | `credit_card` | `walk_in`), `paid_at`, `provider_txn_id`. Keep existing status column.

**Extend `app_settings`** with `pickup_rate_per_km` numeric default 1.50, `waiting_list_response_minutes` int default 30, `default_insurance_provider` text.

**RLS + GRANT** for every new/changed table following project conventions (customer sees own rows; admins via `private.has_role`).

**Trigger**: `assert_slot_capacity()` on `bookings` insert/update — rejects when confirmed bookings for (package_id, booking_date, time_slot_id) + new pax > slot capacity. Confirmed = status in (`paid`, `waiting_rider_assignment`, `rider_assigned`, ...pre-cancellation states).

## 2. Server functions (`src/lib/booking.functions.ts`)

All `.middleware([requireSupabaseAuth])`:
- `getPackageAvailability({ packageId, date })` — returns slots with remaining capacity for the date.
- `calculatePickupFee({ hubId, pickupLat, pickupLng })` — Haversine distance × `pickup_rate_per_km` from app_settings.
- `createBooking(input)` — validates slot availability, computes totals, creates booking in `pending_payment`, returns booking id.
- `joinWaitingList({ packageId, date, timeSlotId })` — assigns queue number.
- `confirmWaitingListSlot({ waitingListId })` — moves entry to booking when notified.
- `getMyBookings()`, `getMyBookingDetail(id)`, `getMyPayments()`, `getMyWaitingList()`, `getMyNotifications()`, `markNotificationRead(id)`.
- `initiatePayment({ bookingId, method })` — creates a `payments` row, returns provider redirect data (stubbed per method).
- `cancelBooking({ bookingId })` — respects cancellation rules; triggers waiting-list promotion.

Notifications: helper `notify(userId, type, title, message)` invoked from every state transition (booking created, payment success/fail, rider assigned, reminder, waiting-list promotion, cancellation). Rider assignment reminder is triggered from admin/rider flows — this phase just handles inserts when those events fire.

## 3. Payment integration (this phase = infrastructure, not live gateways)

- **Chip In / Alipay / Credit Card**: server route `src/routes/api/public/payment-webhook.ts` accepts provider callbacks and updates `payments` + `bookings` status. Client `initiatePayment` returns a redirect URL. For this phase we ship a mock provider selector plus webhook verification scaffolding — real Chip/Alipay credentials are added later via `add_secret`.
- **Walk-in Payment Terminal**: booking stays `pending_payment` with method = walk_in; admin marks paid.
- On successful payment: booking → `paid` → `waiting_rider_assignment`; insurance fields auto-populated from `app_settings.default_insurance_provider` + generated policy number.

## 4. Customer journey UI (`/app/*`)

Rebuild the flow across screens; keep the current mobile shell:

- **`app.packages.$slug.tsx`** — add a "Book Now" CTA that navigates to `/app/book/$slug`.
- **`app.book.$packageId.tsx`** → replace with a **multi-step wizard** at `/app/book/$slug`:
  1. Date picker (calendar, disables full days)
  2. Time slot list (shows remaining capacity; "Join waiting list" button when full)
  3. Vehicle type (single option now — EV Motorcycle — but list-driven)
  4. Meeting method: Walk-in at hub / Hotel pickup
  5. If pickup: hotel/location name, address autocomplete + map picker, auto pickup fee
  6. Review (package, date, slot, pickup summary, insurance disclosure, total)
  7. Payment method selector → redirect / walk-in confirmation
- **`app.bookings.index.tsx`** — split into Upcoming vs History tabs, show status pill, pickup badge.
- **`app.bookings.$id.tsx`** — full detail: booking number, status timeline (11 states), rider info once assigned, pickup map, insurance, payment record, cancel action.
- **`app.payments.tsx`** (new) — payment history list.
- **`app.waiting-list.tsx`** (new) — my waiting list entries with position + confirm/decline when promoted.
- **`app.notifications.tsx`** (new) — list + mark-as-read; badge on bottom nav.
- **`app.profile.tsx`** — keep existing; add Notifications & Waiting List entry links.

## 5. Waiting list automation

When a booking is cancelled or no-show, a Postgres trigger updates the next `waiting` row for that (package, date, slot) to `notified`, sets `respond_by = now() + app_settings.waiting_list_response_minutes`, and inserts a notification. A lightweight cron-style server route `src/routes/api/public/waiting-list-sweep.ts` (invoked by pg_cron or manual admin trigger) expires overdue entries and promotes the next in line.

## 6. Insurance

On payment success, populate booking's insurance fields: provider from `app_settings.default_insurance_provider` (default "EV Kg Baru Daily Cover"), policy number `INS-{booking_no}`, coverage_date = booking_date, status `active`. Displayed on booking detail; no external API this phase.

## Out of scope

Rider assignment UI, admin booking management redesign, live Chip/Alipay merchant onboarding, SMS/email delivery of notifications (in-app only), map provider selection beyond a lat/lng picker.

## Technical notes

- New route files use existing TanStack Start conventions and `_authenticated` layout gate.
- All server fns follow `.functions.ts` splitting rules; webhooks under `src/routes/api/public/*` verify signatures.
- Capacity enforcement is authoritative in the DB trigger; UI uses server-fn availability checks for UX only.
- Every mutation logs a `notifications` row via the `notify` helper.
