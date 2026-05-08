import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDate, fmtTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string; payment_status: string;
  pickup_hub_id: string | null; rider_id: string | null;
  tour_packages: { package_name: string } | null;
  profiles: { name: string; phone: string | null } | null;
  hubs: { name: string } | null;
  riders: { id: string; name: string } | null;
}

function AdminBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [assigning, setAssigning] = useState<Row | null>(null);
  const [riderOpts, setRiderOpts] = useState<{ id: string; name: string; status: string; hub_id: string | null }[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, payment_status, pickup_hub_id, rider_id, tour_packages(package_name), profiles!bookings_tourist_id_fkey(name, phone), hubs:pickup_hub_id(name), riders(id, name)")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from("riders").select("id, name, status, hub_id").then(({ data }) => setRiderOpts(data ?? []));
  }, []);

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.booking_status !== status) return false;
    if (q && !`${r.booking_no} ${r.profiles?.name ?? ""} ${r.tour_packages?.package_name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function assign(riderId: string) {
    if (!assigning) return;
    const { error } = await supabase.from("bookings").update({ rider_id: riderId, booking_status: "assigned" }).eq("id", assigning.id);
    if (error) return toast.error(error.message);
    await supabase.from("riders").update({ status: "assigned" }).eq("id", riderId);
    toast.success("Rider assigned");
    setAssigning(null); load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Bookings</h1><p className="text-sm text-muted-foreground">{filtered.length} of {rows.length}</p></div>
      </div>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search booking, customer, package…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-full" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase border-b">
              <tr><th className="p-3">Booking</th><th className="p-3">Customer</th><th className="p-3">Package</th><th className="p-3">When</th><th className="p-3">Hub</th><th className="p-3">Rider</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3 font-mono text-xs">{r.booking_no}</td>
                  <td className="p-3">{r.profiles?.name}<div className="text-xs text-muted-foreground">{r.profiles?.phone}</div></td>
                  <td className="p-3">{r.tour_packages?.package_name}<div className="text-xs text-muted-foreground">{r.pax} pax</div></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(r.booking_date)}<div className="text-xs">{fmtTime(r.booking_time)}</div></td>
                  <td className="p-3 text-muted-foreground">{r.hubs?.name ?? "—"}</td>
                  <td className="p-3">{r.riders?.name ?? <span className="text-warning">Unassigned</span>}</td>
                  <td className="p-3 font-semibold">{money(r.total_price)}</td>
                  <td className="p-3"><div className="flex flex-col gap-1"><StatusBadge status={r.booking_status} /><StatusBadge status={r.payment_status} /></div></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to="/admin/bookings/$id" params={{ id: r.id }} className="text-xs text-primary hover:underline">View</Link>
                      {!r.rider_id && r.payment_status === "paid" && (
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAssigning(r)}><UserPlus className="w-3 h-3 mr-1" /> Assign</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign rider — {assigning?.booking_no}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {riderOpts.map((rd) => {
              const sameHub = rd.hub_id === assigning?.pickup_hub_id;
              return (
                <button key={rd.id} onClick={() => assign(rd.id)}
                  className="w-full text-left p-3 rounded-xl border hover:border-primary hover:bg-muted/40 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{rd.name} {sameHub && <span className="text-xs text-success">· same hub</span>}</div>
                    <div className="text-xs text-muted-foreground capitalize">{rd.status}</div>
                  </div>
                  <span className="text-xs text-primary">Assign</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
