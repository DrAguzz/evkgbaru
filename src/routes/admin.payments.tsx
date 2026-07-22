import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import { exportCSV, exportExcel } from "@/lib/export";
import { CreditCard, Search, CheckCircle2, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { autoAssignRider } from "@/lib/booking";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

interface PayRow {
  id: string; amount: number; payment_method: string; status: string;
  transaction_id: string | null; provider_txn_id: string | null; payment_reference: string | null;
  created_at: string; paid_at: string | null; booking_id: string;
  bookings: { booking_no: string; total_price: number; payment_status: string; pickup_hub_id: string | null; tourist_id: string;
    profiles: { name: string; email: string } | null } | null;
}

function AdminPayments() {
  const { isSuperAdmin, hubIds } = useAuth();
  const [rows, setRows] = useState<PayRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState({
    from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    let q = supabase.from("payments")
      .select("id, amount, payment_method, status, transaction_id, provider_txn_id, payment_reference, created_at, paid_at, booking_id, bookings!inner(booking_no, total_price, payment_status, pickup_hub_id, tourist_id, profiles!bookings_tourist_profile_fkey(name, email))")
      .gte("created_at", `${range.from}T00:00:00`).lte("created_at", `${range.to}T23:59:59`)
      .order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    let list = (data ?? []) as unknown as PayRow[];
    if (!isSuperAdmin) list = list.filter((r) => r.bookings?.pickup_hub_id && hubIds.includes(r.bookings.pickup_hub_id));
    setRows(list);
  }, [isSuperAdmin, hubIds, status, range]);

  useEffect(() => { load(); }, [load]);

  async function verify(p: PayRow) {
    if (!confirm(`Mark payment for ${p.bookings?.booking_no} as PAID?`)) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("payments").update({ status: "success", paid_at: now }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("bookings").update({ payment_status: "paid", booking_status: "waiting_rider_assignment" }).eq("id", p.booking_id);
    if (p.bookings?.tourist_id) {
      await supabase.from("notifications").insert({
        user_id: p.bookings.tourist_id,
        title: "Payment received", message: `Payment for ${p.bookings.booking_no} has been verified.`,
        type: "payment_success", status: "unread",
      });
    }
    await autoAssignRider(p.booking_id);
    await logAudit({ action: "payment_verify", entity: "payments", entity_id: p.id, metadata: { booking: p.bookings?.booking_no, amount: p.amount } });
    toast.success("Payment verified");
    load();
  }

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.bookings?.booking_no.toLowerCase().includes(q)
      || r.bookings?.profiles?.name?.toLowerCase().includes(q)
      || r.bookings?.profiles?.email?.toLowerCase().includes(q)
      || r.payment_reference?.toLowerCase().includes(q)
      || r.provider_txn_id?.toLowerCase().includes(q);
  });

  const exportRows = filtered.map((r) => ({
    date: new Date(r.created_at).toISOString(),
    booking: r.bookings?.booking_no ?? "",
    customer: r.bookings?.profiles?.name ?? "",
    email: r.bookings?.profiles?.email ?? "",
    method: r.payment_method,
    status: r.status,
    reference: r.payment_reference ?? r.provider_txn_id ?? "",
    amount: Number(r.amount).toFixed(2),
  }));
  const exportCols = [
    { key: "date" as const, header: "Date" }, { key: "booking" as const, header: "Booking" },
    { key: "customer" as const, header: "Customer" }, { key: "email" as const, header: "Email" },
    { key: "method" as const, header: "Method" }, { key: "status" as const, header: "Status" },
    { key: "reference" as const, header: "Reference" }, { key: "amount" as const, header: "Amount (RM)" },
  ];

  const totalCollected = filtered.filter((r) => r.status === "success" || r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        subtitle="Verify, review and export payment records"
        icon={CreditCard}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(exportRows, exportCols, `payments-${range.from}-to-${range.to}`)} disabled={!filtered.length}><FileDown className="w-4 h-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(exportRows, exportCols, `payments-${range.from}-to-${range.to}`, "Payments")} disabled={!filtered.length}><FileSpreadsheet className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        }
      />

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Booking, customer or reference" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            <Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Transactions" value={filtered.length} />
        <StatCard label="Collected" value={money(totalCollected)} tone="success" />
        <StatCard label="Pending" value={filtered.filter((r) => r.status === "pending").length} tone="warning" />
        <StatCard label="Failed" value={filtered.filter((r) => r.status === "failed").length} tone="destructive" />
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground bg-muted/50">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Booking</th><th className="p-3">Customer</th>
                <th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Amount</th>
                <th className="p-3">Status</th><th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.bookings?.booking_no}</td>
                  <td className="p-3"><div>{r.bookings?.profiles?.name}</div><div className="text-xs text-muted-foreground">{r.bookings?.profiles?.email}</div></td>
                  <td className="p-3"><span className="text-xs uppercase font-medium">{r.payment_method}</span></td>
                  <td className="p-3 text-xs font-mono text-muted-foreground">{r.payment_reference ?? r.provider_txn_id ?? "—"}</td>
                  <td className="p-3 font-semibold">{money(Number(r.amount))}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-right">
                    {r.status === "pending" && <Button size="sm" onClick={() => verify(r)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verify</Button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No payments in range.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <Card className="rounded-2xl border-0 shadow-card">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-bold mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
