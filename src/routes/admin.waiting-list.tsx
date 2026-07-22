import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime } from "@/lib/format";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/admin/waiting-list")({ component: AdminWaitingList });

interface Row {
  id: string; queue_number: number; booking_date: string; status: string;
  created_at: string; respond_by: string | null; notified_at: string | null;
  package_id: string; customer_id: string; time_slot_id: string | null;
  tour_packages: { package_name: string } | null;
  profiles: { name: string; email: string; phone: string | null } | null;
  package_time_slots: { start_time: string } | null;
}

function AdminWaitingList() {
  const { isSuperAdmin, hubIds } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("waiting_list")
      .select("id, queue_number, booking_date, status, created_at, respond_by, notified_at, package_id, customer_id, time_slot_id, tour_packages(package_name, hub_id), profiles!waiting_list_customer_id_fkey(name, email, phone), package_time_slots(start_time)")
      .order("created_at", { ascending: false });
    let list = (data ?? []) as unknown as Array<Row & { tour_packages: { package_name: string; hub_id: string | null } | null }>;
    if (!isSuperAdmin) list = list.filter((r) => r.tour_packages?.hub_id && hubIds.includes(r.tour_packages.hub_id));
    setRows(list);
  }, [isSuperAdmin, hubIds]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`admin-wl-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "waiting_list" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const buckets = {
    waiting: rows.filter((r) => r.status === "waiting"),
    notified: rows.filter((r) => r.status === "notified"),
    resolved: rows.filter((r) => ["confirmed", "expired", "cancelled"].includes(r.status)),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Waiting list" subtitle="Customers queued for full slots" icon={ListChecks} />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Waiting" value={buckets.waiting.length} tone="warning" />
        <StatCard label="Notified" value={buckets.notified.length} tone="primary" />
        <StatCard label="Resolved" value={buckets.resolved.length} />
      </div>
      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground bg-muted/50">
              <tr>
                <th className="p-3">Requested</th><th className="p-3">Customer</th><th className="p-3">Package</th>
                <th className="p-3">Booking date</th><th className="p-3">Queue #</th><th className="p-3">Respond by</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3"><div>{r.profiles?.name}</div><div className="text-xs text-muted-foreground">{r.profiles?.phone}</div></td>
                  <td className="p-3">{r.tour_packages?.package_name}</td>
                  <td className="p-3 text-xs">{fmtDate(r.booking_date)}{r.package_time_slots ? ` · ${fmtTime(r.package_time_slots.start_time)}` : ""}</td>
                  <td className="p-3 font-mono">#{r.queue_number}</td>
                  <td className="p-3 text-xs">{r.respond_by ? new Date(r.respond_by).toLocaleString() : "—"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No waiting-list entries.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Waiting-list customers are auto-notified when a booking on their slot is cancelled. Configure the response window in <Link to="/admin/settings" className="text-primary hover:underline">Settings</Link>.</p>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "primary" | "warning" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card className="rounded-2xl border-0 shadow-card">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-bold mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
