## Current state (verified)

- `demo.rider@evride.test` sudah wujud sebagai rider di bawah **Kg Baru Hub** (rider code `RT-5111-8318`, employment full_time, status available).
- Akaun ini sudah dikonfigurasi sebagai demo rider login di `src/lib/demo-login.functions.ts` (butang "Try Demo Rider account" di skrin login rider guna akaun ni).
- Rider ini **belum ada booking** assigned — sebab tu rider app kosong bila login.

Jadi permintaan (1) & (2) sebenarnya sudah selesai. Yang perlu dibuat adalah **dummy bookings** supaya ada data untuk testing rider app.

## Rancangan: seed dummy bookings untuk demo rider

Tambah 6 booking dummy yang di-assign kepada `demo.rider@evride.test`, meliputi setiap fasa tour lifecycle supaya semua skrin rider app boleh diuji:

| # | Status | Tarikh | Package | Tujuan test |
|---|--------|--------|---------|-------------|
| 1 | `rider_assigned` | Hari ini | KL City Highlights | Skrin "upcoming — awaiting check-in" |
| 2 | `customer_checked_in` | Hari ini | National Monument Trail | Butang "Start safety briefing" |
| 3 | `safety_briefing_completed` | Hari ini | KL Tower | Butang "Start ride" |
| 4 | `ride_started` | Hari ini | Masjid Negara & Museum | Skrin live tour + SOS + complete |
| 5 | `ride_completed` | Semalam | Bukit Bintang | Skrin history + review |
| 6 | `rider_assigned` | Esok | KL City Highlights | Upcoming schedule |

Setiap booking akan ada:
- Customer tourist (guna profil sedia ada mcm `thoriqmohd@gmail.com`)
- Pickup hub = Kg Baru Hub
- Time slot dari `booking_time` (contoh 09:00, 14:00, 17:00)
- `total_price`, `pax`, `payment_status='paid'`
- `meeting_method='walk_in'`

## Nota

- Tiada perubahan kod — hanya data insert ke jadual `bookings`.
- Tiada perubahan skema, tiada migration.
- Jika mahu lebih banyak scenario (contoh cancelled, no_show, hotel_pickup dengan pickup fee), boleh tambah selepas ni.

Approve untuk saya insert dummy bookings ni.
