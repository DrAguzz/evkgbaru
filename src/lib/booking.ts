import { supabase } from "@/integrations/supabase/client";

/** Auto-assign first available rider at the booking's pickup hub.
 *  Returns the assigned rider id, or null if none found. */
export async function autoAssignRider(bookingId: string): Promise<string | null> {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, pickup_hub_id, tourist_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return null;

  let q = supabase.from("riders").select("id").eq("status", "available").limit(1);
  if (booking.pickup_hub_id) q = q.eq("hub_id", booking.pickup_hub_id);
  const { data: riders } = await q;
  const rider = riders?.[0];

  if (!rider) {
    await supabase.from("notifications").insert({
      user_id: booking.tourist_id,
      title: "No rider available",
      message: "Admin will manually assign a rider for your booking shortly.",
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
    message: "A rider has been assigned to your tour.",
    type: "success",
  });
  return rider.id;
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
