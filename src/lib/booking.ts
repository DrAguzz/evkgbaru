import { supabase } from "@/integrations/supabase/client";

/** Auto-assign first available rider at the booking's pickup hub.
 *  Returns assigned rider id, or null if none found. */
export async function autoAssignRider(
  bookingId: string,
  excludeRiderIds: string[] = [],
): Promise<string | null> {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, pickup_hub_id, tourist_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return null;

  const tryQuery = async (sameHub: boolean) => {
    let q = supabase.from("riders").select("id, name").eq("status", "available").limit(1);
    if (sameHub && booking.pickup_hub_id) q = q.eq("hub_id", booking.pickup_hub_id);
    if (excludeRiderIds.length) q = q.not("id", "in", `(${excludeRiderIds.join(",")})`);
    const { data } = await q;
    return data?.[0] ?? null;
  };

  const rider = (await tryQuery(true)) ?? (await tryQuery(false));

  if (!rider) {
    await supabase
      .from("bookings")
      .update({ booking_status: "waiting_rider_assignment" })
      .eq("id", bookingId);
    await supabase.from("notifications").insert({
      user_id: booking.tourist_id,
      title: "Searching for a rider",
      message: "All riders are busy. We'll assign one shortly.",
      type: "warning",
      status: "unread",
    });
    return null;
  }

  await supabase
    .from("bookings")
    .update({ rider_id: rider.id, booking_status: "rider_assigned" })
    .eq("id", bookingId);
  await supabase.from("riders").update({ status: "assigned" }).eq("id", rider.id);
  await supabase.from("notifications").insert({
    user_id: booking.tourist_id,
    title: "Rider assigned",
    message: `${rider.name} has been assigned to your tour.`,
    type: "rider_assigned",
    status: "unread",
  });
  return rider.id;
}

export async function rejectAssignment(bookingId: string, riderId: string) {
  await supabase.from("riders").update({ status: "available" }).eq("id", riderId);
  await supabase
    .from("bookings")
    .update({ rider_id: null, booking_status: "waiting_rider_assignment" })
    .eq("id", bookingId);
  return autoAssignRider(bookingId, [riderId]);
}

/** Haversine km */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function getPickupRate(): Promise<number> {
  const { data } = await supabase.from("app_settings").select("pickup_rate_per_km").limit(1).maybeSingle();
  return Number(data?.pickup_rate_per_km ?? 1.5);
}

/** Count booked pax for a package/date/time */
export async function countBookedPax(packageId: string, date: string, time: string): Promise<number> {
  const { data } = await supabase
    .from("bookings")
    .select("pax, booking_status")
    .eq("package_id", packageId)
    .eq("booking_date", date)
    .eq("booking_time", time);
  return (data ?? [])
    .filter((r) => !["cancelled", "no_show", "payment_failed"].includes(r.booking_status))
    .reduce((sum, r) => sum + (r.pax || 0), 0);
}

export async function joinWaitingList(input: {
  customerId: string; packageId: string; date: string; time: string; pax: number;
}) {
  // find next queue number - use existing slot or create synthetic. Since time_slot_id is nullable
  // in bookings, waiting_list still requires it. We'll skip time_slot_id and just use date+time by
  // creating one via package_time_slots on demand — but simpler: relax by using any slot for this pkg.
  const { data: slot } = await supabase
    .from("package_time_slots")
    .select("id")
    .eq("package_id", input.packageId)
    .limit(1)
    .maybeSingle();
  if (!slot) throw new Error("No time slot configured for this package");
  const { data: existing } = await supabase
    .from("waiting_list")
    .select("queue_number")
    .eq("package_id", input.packageId)
    .eq("booking_date", input.date)
    .eq("time_slot_id", slot.id)
    .order("queue_number", { ascending: false })
    .limit(1);
  const nextNo = (existing?.[0]?.queue_number ?? 0) + 1;
  const { data, error } = await supabase.from("waiting_list").insert({
    customer_id: input.customerId,
    package_id: input.packageId,
    booking_date: input.date,
    time_slot_id: slot.id,
    pax: input.pax,
    queue_number: nextNo,
    status: "waiting",
  }).select("id, queue_number").single();
  if (error) throw error;
  return data;
}

export async function processMockPayment(bookingId: string, method: string, amount: number) {
  const txn = "TXN" + Date.now() + Math.floor(Math.random() * 1000);
  const ref = "PAY-" + Date.now();
  // Walk-in stays pending until admin confirms
  if (method === "walk_in") {
    await supabase.from("payments").insert({
      booking_id: bookingId, payment_method: "walk_in", payment_gateway: "walk_in",
      transaction_id: txn, payment_reference: ref, amount, status: "pending",
    });
    return { txn, ref, walkIn: true };
  }
  const { error: payErr } = await supabase.from("payments").insert({
    booking_id: bookingId, payment_method: method, payment_gateway: "mock",
    transaction_id: txn, payment_reference: ref, amount, status: "paid",
    paid_at: new Date().toISOString(),
  });
  if (payErr) throw payErr;

  // Get booking + settings for insurance
  const { data: b } = await supabase
    .from("bookings")
    .select("booking_no, booking_date, tourist_id")
    .eq("id", bookingId)
    .single();
  const { data: s } = await supabase
    .from("app_settings")
    .select("default_insurance_provider")
    .limit(1)
    .maybeSingle();

  await supabase.from("bookings").update({
    payment_status: "paid",
    booking_status: "paid",
    insurance_provider: s?.default_insurance_provider ?? "EVRide Daily Cover",
    insurance_policy_no: `INS-${b?.booking_no ?? bookingId.slice(0, 8)}`,
    insurance_coverage_date: b?.booking_date,
    insurance_status: "active",
  }).eq("id", bookingId);

  if (b?.tourist_id) {
    await supabase.from("notifications").insert({
      user_id: b.tourist_id,
      title: "Payment successful",
      message: `Booking ${b.booking_no} confirmed. Insurance activated.`,
      type: "payment_success",
      status: "unread",
    });
  }

  await autoAssignRider(bookingId);
  return { txn, ref, walkIn: false };
}
