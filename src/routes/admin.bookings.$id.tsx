import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime } from "@/lib/format";
import { ArrowLeft, Calendar, Users, MapPin, Bike, UserPlus, RotateCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings/$id")({ component: AdminBookingDetail });

interface Booking {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string; payment_status: string;
  special_request: string | null; pickup_hub_id: string | null; rider_id: string | null;
  package_id: string;
  tour_packages: { package_name: string; image: string | null; duration_minutes: number } | null;
  hubs: { name: string; address: string | null } | null;
  profiles: { name: string; phone: string | null; email: string } | null;
  riders: { id: string; name: string; phone: string | null; vehicle_id: string | null } | null;
}
interface RouteRow { sequence_no: number; estimated_minutes: number; locations: { id: string; name: string } | null; }
interface Progress { sequence_no: number; status: string; arrival_time: string | null; remarks: string | null; }
interface Payment { id: string; amount: number; payment_method: string; status: string; transaction_id: string | null; paid_at: string | null; }
interface Rider { id: string; name: string; status: string; hub_id: string | null; }

function AdminBookingDetail() {
  const { id } = Route.useParams();
  const [b, setB] = useState<Booking | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, payment_status, special_request, pickup_hub_id, rider_id, package_id, tour_packages(package_name, image, duration_minutes), hubs:pickup_hub_id(name, address), profiles!bookings_tourist_profile_fkey(name, phone, email), riders(id, name, phone, vehicle_id)")
      .eq("id", id).maybeSingle();
    setB(data as unknown as Booking);
    if (data?.package_id) {
      const { data: r } = await supabase.from("package_routes").select("sequence_no, estimated_minutes, locations(id, name)").eq("package_id", data.package_id).order("sequence_no");
      setRoutes((r ?? []) as unknown as RouteRow[]);
    }
    const { data: p } = await supabase.from("tour_progress").select("sequence_no, status, arrival_time, remarks").eq("booking_id", id).order("sequence_no");
    setProgress(p ?? []);
    const { data: pay } = await supabase.from("payments").select("*").eq("booking_id", id);
    setPayments((pay ?? []) as Payment[]);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel(`admin-bk-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tour_progress", filter: `booking_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  async function openAssign() {
    const { data } = await supabase.from("riders").select("id, name, status, hub_id").order("name");
    setRiders(data ?? []);
    setAssignOpen(true);
  }
  async function assign(riderId: string) {
    if (!b) return;
    if (b.rider_id) await supabase.from("riders").update({ status: "available" }).eq("id", b.rider_id);
    await supabase.from("bookings").update({ rider_id: riderId, booking_status: "assigned" }).eq("id", b.id);
    await supabase.from("riders").update({ status: "assigned" }).eq("id", riderId);
    toast.success("Rider assigned");
    setAssignOpen(false); load();
  }
  async function cancelBooking() {
    if (!b || !confirm("Cancel this booking?")) return;
    await supabase.from("bookings").update({ booking_status: "cancelled" }).eq("id", b.id);
    if (b.rider_id) await supabase.from("riders").update({ status: "available" }).eq("id", b.rider_id);
    toast.success("Booking cancelled"); load();
  }

  if (!b) return <div className="p-8">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/admin/bookings" className="grid place-items-center w-9 h-9 rounded-full bg-card border"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{b.booking_no}</h1>
          <div className="flex gap-2 mt-1"><StatusBadge status={b.booking_status} /><StatusBadge status={b.payment_status} /></div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={openAssign}>
            {b.rider_id ? <RotateCw className="w-4 h-4 mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
            {b.rider_id ? "Reassign rider" : "Assign rider"}
          </Button>
          {b.booking_status !== "completed" && b.booking_status !== "cancelled" && (
            <Button variant="outline" className="rounded-full text-destructive" onClick={cancelBooking}>Cancel booking</Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
            <div className="aspect-[16/5] bg-muted"><img src={b.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
            <CardContent className="p-5">
              <div className="font-semibold text-lg">{b.tour_packages?.package_name}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Date</div><div className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(b.booking_date)}</div></div>
                <div><div className="text-xs text-muted-foreground">Time</div><div className="font-medium">{fmtTime(b.booking_time)}</div></div>
                <div><div className="text-xs text-muted-foreground">Pax</div><div className="font-medium flex items-center gap-1"><Users className="w-3 h-3" />{b.pax}</div></div>
                <div><div className="text-xs text-muted-foreground">Total</div><div className="font-bold">{money(b.total_price)}</div></div>
              </div>
              {b.special_request && <div className="mt-3 text-sm bg-muted rounded-xl p-3"><span className="text-xs text-muted-foreground">Special request:</span> {b.special_request}</div>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
            <div className="font-semibold mb-3">Tour progress</div>
            {routes.length === 0 ? <div className="text-sm text-muted-foreground">No checkpoints configured.</div> : (
              <ol className="relative pl-6 space-y-3">
                <span className="absolute left-2 top-1 bottom-1 w-px bg-border" />
                {routes.map((r) => {
                  const done = progress.find((p) => p.sequence_no === r.sequence_no);
                  return (
                    <li key={r.sequence_no} className="relative">
                      <span className={`absolute -left-[11px] top-1 w-4 h-4 rounded-full border-2 ${done ? "bg-success border-success" : "bg-background border-border"}`} />
                      <div className="text-sm font-medium">{r.locations?.name}</div>
                      <div className="text-xs text-muted-foreground">{done ? `Arrived ${done.arrival_time ? new Date(done.arrival_time).toLocaleTimeString() : ""}` : `~${r.estimated_minutes} min est.`}</div>
                      {done?.remarks && <div className="text-xs italic text-muted-foreground">"{done.remarks}"</div>}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent></Card>

          {payments.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
              <div className="font-semibold mb-3">Payments</div>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase text-left"><tr><th className="py-2">Method</th><th className="py-2">Txn ID</th><th className="py-2">Amount</th><th className="py-2">Status</th><th className="py-2">When</th></tr></thead>
                <tbody>{payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 capitalize">{p.payment_method}</td>
                    <td className="py-2 font-mono text-xs">{p.transaction_id ?? "—"}</td>
                    <td className="py-2 font-semibold">{money(p.amount)}</td>
                    <td className="py-2"><StatusBadge status={p.status} /></td>
                    <td className="py-2 text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent></Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
            <div className="text-xs uppercase text-muted-foreground mb-2">Customer</div>
            <div className="font-semibold">{b.profiles?.name}</div>
            <div className="text-xs text-muted-foreground">{b.profiles?.email}</div>
            <div className="text-xs text-muted-foreground">{b.profiles?.phone ?? "—"}</div>
          </CardContent></Card>

          <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
            <div className="text-xs uppercase text-muted-foreground mb-2">Pickup hub</div>
            <div className="font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.hubs?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{b.hubs?.address}</div>
          </CardContent></Card>

          <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
            <div className="text-xs uppercase text-muted-foreground mb-2">Rider</div>
            {b.riders ? (
              <>
                <div className="font-semibold flex items-center gap-1"><Bike className="w-3 h-3" /> {b.riders.name}</div>
                <div className="text-xs text-muted-foreground">{b.riders.phone ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Vehicle: {b.riders.vehicle_id ?? "—"}</div>
              </>
            ) : <div className="text-sm text-warning">No rider assigned</div>}
          </CardContent></Card>
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{b.rider_id ? "Reassign" : "Assign"} rider</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {riders.map((rd) => {
              const sameHub = rd.hub_id === b.pickup_hub_id;
              const isCurrent = rd.id === b.rider_id;
              return (
                <button key={rd.id} disabled={isCurrent} onClick={() => assign(rd.id)}
                  className="w-full text-left p-3 rounded-xl border hover:border-primary hover:bg-muted/40 flex items-center justify-between disabled:opacity-40">
                  <div>
                    <div className="font-medium">{rd.name} {sameHub && <span className="text-xs text-success">· same hub</span>} {isCurrent && <span className="text-xs">(current)</span>}</div>
                    <div className="text-xs text-muted-foreground capitalize">{rd.status}</div>
                  </div>
                  <span className="text-xs text-primary">{isCurrent ? "—" : "Assign"}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
