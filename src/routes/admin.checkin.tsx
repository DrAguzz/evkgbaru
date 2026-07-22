import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime } from "@/lib/format";
import { Search, UserCheck, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/checkin")({ component: AdminCheckIn });

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; booking_status: string; payment_status: string;
  pickup_hub_id: string | null;
  tour_packages: { package_name: string } | null;
  profiles: { name: string; phone: string | null; email: string } | null;
  check_ins: { id: string; payment_verified: boolean; identity_verified: boolean; checked_in_at: string }[];
  safety_briefings: { id: string; briefing_time: string }[];
}

function AdminCheckIn() {
  const { user, isSuperAdmin, hubIds } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Row | null>(null);
  const [payOk, setPayOk] = useState(false);
  const [idOk, setIdOk] = useState(false);
  const [idDoc, setIdDoc] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, booking_status, payment_status, pickup_hub_id, tour_packages(package_name), profiles!bookings_tourist_profile_fkey(name, phone, email), check_ins(id, payment_verified, identity_verified, checked_in_at), safety_briefings(id, briefing_time)")
      .eq("booking_date", today)
      .in("booking_status", ["paid", "waiting_rider_assignment", "rider_assigned", "accepted", "on_the_way", "customer_checked_in", "safety_briefing_completed"])
      .order("booking_time");
    if (!isSuperAdmin && hubIds.length) q = q.in("pickup_hub_id", hubIds);
    const { data } = await q;
    setRows((data ?? []) as unknown as Row[]);
  }, [isSuperAdmin, hubIds]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`admin-checkin-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "check_ins" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "safety_briefings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  function openVerify(r: Row) {
    setActive(r);
    setPayOk(r.payment_status === "paid");
    setIdOk(false); setIdDoc(""); setNotes("");
  }

  async function doCheckIn() {
    if (!active || !user) return;
    if (!payOk) return toast.error("Payment must be verified before check-in.");
    if (!idOk) return toast.error("Identity must be verified.");
    const { error } = await supabase.from("check_ins").insert({
      booking_id: active.id, verified_by: user.id,
      payment_verified: payOk, identity_verified: idOk,
      identity_document: idDoc || null, notes: notes || null,
    });
    if (error) return toast.error(error.message);
    await supabase.from("bookings").update({ booking_status: "customer_checked_in" }).eq("id", active.id);
    await supabase.from("notifications").insert({
      user_id: (await supabase.from("bookings").select("tourist_id").eq("id", active.id).single()).data?.tourist_id,
      title: "Checked in", message: "You have been checked in at the hub. Safety briefing next.", type: "customer_checked_in", status: "unread",
    });
    toast.success("Customer checked in");
    setActive(null); load();
  }

  async function doBriefing(r: Row) {
    if (!user) return;
    const { error } = await supabase.from("safety_briefings").insert({
      booking_id: r.id, briefed_by: user.id, status: "completed",
    });
    if (error) return toast.error(error.message);
    await supabase.from("bookings").update({ booking_status: "safety_briefing_completed" }).eq("id", r.id);
    await supabase.from("notifications").insert({
      user_id: (await supabase.from("bookings").select("tourist_id").eq("id", r.id).single()).data?.tourist_id,
      title: "Safety briefing completed", message: "Your ride is ready to begin.", type: "briefing_completed", status: "unread",
    });
    toast.success("Briefing marked completed");
    load();
  }

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.booking_no.toLowerCase().includes(q) || r.profiles?.name?.toLowerCase().includes(q) || r.profiles?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Check-in queue</h1>
          <p className="text-sm text-muted-foreground">Verify payment &amp; identity, then check the customer in.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search booking / name" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="p-3">Booking</th><th className="p-3">Customer</th><th className="p-3">Package</th>
                <th className="p-3">Time</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const ci = r.check_ins[0]; const br = r.safety_briefings[0];
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono text-xs"><Link to="/admin/bookings/$id" params={{ id: r.id }} className="hover:text-primary">{r.booking_no}</Link></td>
                    <td className="p-3">
                      <div className="font-medium">{r.profiles?.name}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.phone}</div>
                    </td>
                    <td className="p-3">{r.tour_packages?.package_name}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(r.booking_date)}<br />{fmtTime(r.booking_time)} · {r.pax} pax</td>
                    <td className="p-3"><StatusBadge status={r.payment_status} /></td>
                    <td className="p-3"><StatusBadge status={r.booking_status} /></td>
                    <td className="p-3 text-right">
                      {!ci && (
                        <Button size="sm" onClick={() => openVerify(r)} disabled={r.payment_status !== "paid"}>
                          <UserCheck className="w-4 h-4 mr-1" /> Check in
                        </Button>
                      )}
                      {ci && !br && (
                        <Button size="sm" variant="secondary" onClick={() => doBriefing(r)}>
                          <ShieldCheck className="w-4 h-4 mr-1" /> Complete briefing
                        </Button>
                      )}
                      {ci && br && <span className="text-xs text-success font-medium">✓ Ready</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bookings for today.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify &amp; check in</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="font-mono text-xs">{active.booking_no}</div>
                <div className="font-semibold">{active.profiles?.name}</div>
                <div className="text-xs text-muted-foreground">{active.tour_packages?.package_name} · {active.pax} pax</div>
              </div>
              {active.payment_status !== "paid" && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive p-3 text-xs"><AlertCircle className="w-4 h-4" /> Payment is not complete — check-in blocked.</div>
              )}
              <label className="flex items-center gap-2"><Checkbox checked={payOk} onCheckedChange={(v) => setPayOk(v === true)} disabled={active.payment_status !== "paid"} /> Payment verified</label>
              <label className="flex items-center gap-2"><Checkbox checked={idOk} onCheckedChange={(v) => setIdOk(v === true)} /> Customer identity verified</label>
              <Input placeholder="ID / passport number (optional)" value={idDoc} onChange={(e) => setIdDoc(e.target.value)} />
              <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={doCheckIn}>Check in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
