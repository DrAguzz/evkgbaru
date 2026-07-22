import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime, money } from "@/lib/format";
import { UserPlus, RotateCw, Bike } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trips")({ component: AdminTrips });

interface Trip {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string; pickup_hub_id: string | null;
  rider_id: string | null;
  tour_packages: { package_name: string } | null;
  hubs: { name: string } | null;
  profiles: { name: string; phone: string | null } | null;
  riders: { id: string; name: string; rider_code: string | null; status: string; phone: string | null } | null;
}
interface Rider { id: string; name: string; rider_code: string | null; status: string; hub_id: string | null; }

function AdminTrips() {
  const { isSuperAdmin, hubIds } = useAuth();
  const [rows, setRows] = useState<Trip[]>([]);
  const [assigning, setAssigning] = useState<Trip | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [dateFilter, setDateFilter] = useState<"today" | "upcoming">("today");

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, pickup_hub_id, rider_id, tour_packages(package_name), hubs:pickup_hub_id(name), profiles!bookings_tourist_profile_fkey(name, phone), riders(id, name, rider_code, status, phone)")
      .in("booking_status", ["paid", "waiting_rider_assignment", "rider_assigned", "accepted", "on_the_way", "customer_checked_in", "safety_briefing_completed", "ride_started"])
      .order("booking_date").order("booking_time");
    if (dateFilter === "today") q = q.eq("booking_date", today);
    else q = q.gte("booking_date", today);
    if (!isSuperAdmin && hubIds.length) q = q.in("pickup_hub_id", hubIds);
    const { data } = await q;
    setRows((data ?? []) as unknown as Trip[]);
  }, [isSuperAdmin, hubIds, dateFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`admin-trips-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function openAssign(t: Trip) {
    setAssigning(t);
    let q = supabase.from("riders").select("id, name, rider_code, status, hub_id").in("status", ["available", "busy"]).order("status").order("name");
    if (t.pickup_hub_id) q = q.eq("hub_id", t.pickup_hub_id);
    const { data } = await q;
    setRiders(data ?? []);
  }

  async function checkConflict(riderId: string, t: Trip): Promise<boolean> {
    const { data } = await supabase.from("bookings")
      .select("id, booking_time")
      .eq("rider_id", riderId).eq("booking_date", t.booking_date)
      .in("booking_status", ["rider_assigned", "accepted", "on_the_way", "customer_checked_in", "safety_briefing_completed", "ride_started"]);
    if (!data?.length) return false;
    const target = new Date(`1970-01-01T${t.booking_time}`).getTime();
    return data.some((r) => {
      if (r.id === t.id) return false;
      const other = new Date(`1970-01-01T${r.booking_time}`).getTime();
      return Math.abs(target - other) < 3 * 60 * 60 * 1000; // 3-hour window
    });
  }

  async function assign(r: Rider) {
    if (!assigning) return;
    if (await checkConflict(r.id, assigning)) {
      if (!confirm(`${r.name} has another trip within 3 hours. Assign anyway?`)) return;
    }
    if (assigning.rider_id) await supabase.from("riders").update({ status: "available" }).eq("id", assigning.rider_id);
    await supabase.from("bookings").update({ rider_id: r.id, booking_status: "rider_assigned" }).eq("id", assigning.id);
    await supabase.from("riders").update({ status: "busy" }).eq("id", r.id);
    const { data: tour } = await supabase.from("bookings").select("tourist_id").eq("id", assigning.id).single();
    if (tour?.tourist_id) {
      await supabase.from("notifications").insert({ user_id: tour.tourist_id, title: "Rider assigned", message: `${r.name} has been assigned to your booking.`, type: "rider_assigned", status: "unread" });
    }
    toast.success("Rider assigned"); setAssigning(null); load();
  }

  async function unassign(t: Trip) {
    if (!t.rider_id) return;
    if (!confirm("Remove this rider from the booking?")) return;
    await supabase.from("bookings").update({ rider_id: null, booking_status: "waiting_rider_assignment" }).eq("id", t.id);
    await supabase.from("riders").update({ status: "available" }).eq("id", t.rider_id);
    toast.success("Rider removed"); load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trip schedule</h1>
          <p className="text-sm text-muted-foreground">Assign, reassign or remove riders. Conflicts are flagged.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["today", "upcoming"] as const).map((k) => (
            <button key={k} onClick={() => setDateFilter(k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${dateFilter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {k === "today" ? "Today" : "Upcoming"}
            </button>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase bg-muted/50">
              <tr><th className="p-3">When</th><th className="p-3">Booking</th><th className="p-3">Customer</th><th className="p-3">Package</th><th className="p-3">Hub</th><th className="p-3">Rider</th><th className="p-3">Status</th><th className="p-3">Total</th><th className="p-3 text-right">Action</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground">{fmtDate(t.booking_date)}<br />{fmtTime(t.booking_time)}</td>
                  <td className="p-3 font-mono text-xs"><Link to="/admin/bookings/$id" params={{ id: t.id }} className="hover:text-primary">{t.booking_no}</Link></td>
                  <td className="p-3"><div>{t.profiles?.name}</div><div className="text-xs text-muted-foreground">{t.pax} pax</div></td>
                  <td className="p-3">{t.tour_packages?.package_name}</td>
                  <td className="p-3">{t.hubs?.name ?? "—"}</td>
                  <td className="p-3">
                    {t.riders ? (
                      <div className="text-xs">
                        <div className="font-medium">{t.riders.name}</div>
                        <div className="text-muted-foreground font-mono">{t.riders.rider_code}</div>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                  </td>
                  <td className="p-3"><StatusBadge status={t.booking_status} /></td>
                  <td className="p-3 font-semibold">{money(t.total_price)}</td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => openAssign(t)}>
                      {t.rider_id ? <><RotateCw className="w-3.5 h-3.5 mr-1" /> Reassign</> : <><UserPlus className="w-3.5 h-3.5 mr-1" /> Assign</>}
                    </Button>
                    {t.rider_id && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => unassign(t)}>Remove</Button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No trips found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign rider · {assigning?.booking_no}</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {riders.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">No riders available at this hub.</div>}
            {riders.map((r) => (
              <button key={r.id} onClick={() => assign(r)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-primary/10 text-primary"><Bike className="w-4 h-4" /></span>
                <div className="flex-1">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.rider_code}</div>
                </div>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssigning(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
