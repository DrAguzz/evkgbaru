import { supabase } from "@/integrations/supabase/client";

/** Auto-assign first available rider at the booking's pickup hub.
 *  Optionally exclude rider IDs (e.g., riders who already rejected).
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

  // Try same hub first
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
      .update({ rider_id: null, booking_status: "paid" })
      .eq("id", bookingId);
    await supabase.from("notifications").insert({
      user_id: booking.tourist_id,
      title: "Searching for a rider",
      message: "All riders are busy. Admin will assign one shortly.",
      type: "warning",
    });
    return null;
  }

  await supabase
    .from("bookings")
    .update({ rider_id: rider.id, booking_status: "assigned" })
    .eq("id", bookingId);
  await supabase.from("riders").update({ status: "assigned" }).eq("id", rider.id);
  await supabase.from("notifications").insert({
    user_id: booking.tourist_id,
    title: "Rider assigned",
    message: `${rider.name} has been assigned to your tour.`,
    type: "success",
  });
  return rider.id;
}

/** Rider rejects an assignment; system finds another. */
export async function rejectAssignment(bookingId: string, riderId: string) {
  await supabase.from("riders").update({ status: "available" }).eq("id", riderId);
  await supabase
    .from("bookings")
    .update({ rider_id: null, booking_status: "paid" })
    .eq("id", bookingId);
  // Track previously-rejected riders in special_request? Simpler: just exclude this one.
  return autoAssignRider(bookingId, [riderId]);
}

export async function processMockPayment(bookingId: string, method: string, amount: number) {
  const txn = "TXN" + Date.now() + Math.floor(Math.random() * 1000);
  const { error: payErr } = await supabase.from("payments").insert({
    booking_id: bookingId,
    payment_method: method,
    payment_gateway: "mock",
    transaction_id: txn,
    amount,
    status: "paid",
    paid_at: new Date().toISOString(),
  });
  if (payErr) throw payErr;
  await supabase
    .from("bookings")
    .update({ payment_status: "paid", booking_status: "paid" })
    .eq("id", bookingId);
  await autoAssignRider(bookingId);
  return txn;
}
