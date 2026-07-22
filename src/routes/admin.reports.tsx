import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { money, fmtDate } from "@/lib/format";
import { exportCSV, exportExcel, exportPDF, type ExportColumn } from "@/lib/export";
import { FileBarChart, FileDown, FileSpreadsheet, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

type ReportKey =
  | "bookings_daily" | "bookings_weekly" | "bookings_monthly"
  | "revenue" | "package_performance" | "rider_performance"
  | "hub_performance" | "payment_summary" | "waiting_list" | "customer_ratings";

const REPORTS: Array<{ key: ReportKey; label: string }> = [
  { key: "bookings_daily", label: "Daily bookings" },
  { key: "bookings_weekly", label: "Weekly bookings" },
  { key: "bookings_monthly", label: "Monthly bookings" },
  { key: "revenue", label: "Revenue" },
  { key: "package_performance", label: "Package performance" },
  { key: "rider_performance", label: "Rider performance" },
  { key: "hub_performance", label: "Hub performance" },
  { key: "payment_summary", label: "Payment summary" },
  { key: "waiting_list", label: "Waiting list" },
  { key: "customer_ratings", label: "Customer ratings" },
];

interface Row { [key: string]: string | number }

function defaultRange(kind: ReportKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (kind === "bookings_weekly") from.setDate(to.getDate() - 6);
  else if (kind === "bookings_monthly" || kind === "revenue") from.setDate(1);
  else if (kind === "bookings_daily") from.setDate(to.getDate() - 30);
  else from.setDate(to.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function AdminReports() {
  const { isSuperAdmin, hubIds } = useAuth();
  const [report, setReport] = useState<ReportKey>("bookings_daily");
  const [range, setRange] = useState(defaultRange("bookings_daily"));
  const [hubFilter, setHubFilter] = useState<string>("all");
  const [hubs, setHubs] = useState<Array<{ id: string; name: string }>>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<ExportColumn<Row>[]>([]);
  const [summary, setSummary] = useState<Array<{ label: string; value: string | number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setRange(defaultRange(report)); }, [report]);
  useEffect(() => {
    supabase.from("hubs").select("id, name").order("name").then(({ data }) => setHubs(data ?? []));
  }, []);

  const scopedHubIds = useMemo(() => {
    if (!isSuperAdmin) return hubIds;
    if (hubFilter === "all") return null;
    return [hubFilter];
  }, [isSuperAdmin, hubIds, hubFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runReport(report, range, scopedHubIds);
      setRows(result.rows);
      setCols(result.cols);
      setSummary(result.summary);
    } finally {
      setLoading(false);
    }
  }, [report, range, scopedHubIds]);

  useEffect(() => { load(); }, [load]);

  const label = REPORTS.find((r) => r.key === report)?.label ?? report;
  const filename = `${label.toLowerCase().replace(/\s+/g, "-")}-${range.from}-to-${range.to}`;
  const subtitle = `${fmtDate(range.from)} → ${fmtDate(range.to)}${!isSuperAdmin ? " · your hub(s)" : hubFilter !== "all" ? ` · ${hubs.find((h) => h.id === hubFilter)?.name}` : ""}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        subtitle="Generate and export operational reports"
        icon={FileBarChart}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(rows, cols, filename)} disabled={!rows.length}><FileDown className="w-4 h-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(rows, cols, filename, label)} disabled={!rows.length}><FileSpreadsheet className="w-4 h-4 mr-1" /> Excel</Button>
            <Button size="sm" onClick={() => exportPDF(rows, cols, filename, { title: label, subtitle })} disabled={!rows.length}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
          </div>
        }
      />

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5 grid gap-4 md:grid-cols-4">
          <div>
            <Label className="text-xs">Report</Label>
            <Select value={report} onValueChange={(v) => setReport(v as ReportKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REPORTS.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          {isSuperAdmin && (
            <div>
              <Label className="text-xs">Hub</Label>
              <Select value={hubFilter} onValueChange={setHubFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All hubs</SelectItem>
                  {hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary.map((s) => (
            <Card key={s.label} className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl font-bold mt-1">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No data for the selected range.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>{cols.map((c) => <th key={c.header} className="p-3">{c.header}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className="border-t">
                    {cols.map((c) => (
                      <td key={c.header} className="p-3">
                        {c.format ? c.format(r) : (r[c.key as string] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {rows.length > 200 && (
            <div className="p-3 text-xs text-muted-foreground text-center border-t">Showing first 200 of {rows.length}. Export to see all.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================ */

interface ReportResult { rows: Row[]; cols: ExportColumn<Row>[]; summary: Array<{ label: string; value: string | number }> }

async function runReport(kind: ReportKey, range: { from: string; to: string }, hubIds: string[] | null): Promise<ReportResult> {
  const scope = <T,>(q: T) => {
    if (hubIds && hubIds.length) return (q as unknown as { in: (col: string, arr: string[]) => T }).in("pickup_hub_id", hubIds);
    return q;
  };

  if (kind === "bookings_daily" || kind === "bookings_weekly" || kind === "bookings_monthly") {
    const q = supabase.from("bookings")
      .select("booking_date, total_price, payment_status, booking_status")
      .gte("booking_date", range.from).lte("booking_date", range.to);
    const { data } = await scope(q);
    const list = data ?? [];
    const bucket = (d: string) => {
      if (kind === "bookings_daily") return d;
      if (kind === "bookings_weekly") { const dt = new Date(d); const day = dt.getDay(); const monday = new Date(dt); monday.setDate(dt.getDate() - ((day + 6) % 7)); return `Week of ${monday.toISOString().slice(0, 10)}`; }
      return d.slice(0, 7);
    };
    const map = new Map<string, Row>();
    list.forEach((b) => {
      const k = bucket(b.booking_date);
      const cur = map.get(k) ?? { period: k, bookings: 0, paid: 0, cancelled: 0, revenue: 0 };
      cur.bookings = (cur.bookings as number) + 1;
      if (b.payment_status === "paid") { cur.paid = (cur.paid as number) + 1; cur.revenue = (cur.revenue as number) + Number(b.total_price); }
      if (b.booking_status === "cancelled") cur.cancelled = (cur.cancelled as number) + 1;
      map.set(k, cur);
    });
    const rows = [...map.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
    return {
      rows,
      cols: [
        { key: "period", header: "Period" },
        { key: "bookings", header: "Bookings" },
        { key: "paid", header: "Paid" },
        { key: "cancelled", header: "Cancelled" },
        { key: "revenue", header: "Revenue (RM)", format: (r) => Number(r.revenue).toFixed(2) },
      ],
      summary: [
        { label: "Total bookings", value: list.length },
        { label: "Paid bookings", value: list.filter((b) => b.payment_status === "paid").length },
        { label: "Cancelled", value: list.filter((b) => b.booking_status === "cancelled").length },
        { label: "Revenue", value: money(list.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_price), 0)) },
      ],
    };
  }

  if (kind === "revenue") {
    const q = supabase.from("bookings")
      .select("booking_date, total_price, discount_amount, pickup_fee")
      .eq("payment_status", "paid").gte("booking_date", range.from).lte("booking_date", range.to);
    const { data } = await scope(q);
    const list = data ?? [];
    const map = new Map<string, Row>();
    list.forEach((b) => {
      const k = b.booking_date;
      const cur = map.get(k) ?? { date: k, gross: 0, discount: 0, pickup: 0, net: 0 };
      cur.gross = (cur.gross as number) + Number(b.total_price);
      cur.discount = (cur.discount as number) + Number(b.discount_amount);
      cur.pickup = (cur.pickup as number) + Number(b.pickup_fee ?? 0);
      cur.net = (cur.gross as number);
      map.set(k, cur);
    });
    const rows = [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const total = list.reduce((s, b) => s + Number(b.total_price), 0);
    const disc = list.reduce((s, b) => s + Number(b.discount_amount), 0);
    return {
      rows,
      cols: [
        { key: "date", header: "Date" },
        { key: "gross", header: "Gross (RM)", format: (r) => Number(r.gross).toFixed(2) },
        { key: "discount", header: "Discount (RM)", format: (r) => Number(r.discount).toFixed(2) },
        { key: "pickup", header: "Pickup fee (RM)", format: (r) => Number(r.pickup).toFixed(2) },
      ],
      summary: [
        { label: "Total revenue", value: money(total) },
        { label: "Discounts given", value: money(disc) },
        { label: "Transactions", value: list.length },
        { label: "Avg ticket", value: money(list.length ? total / list.length : 0) },
      ],
    };
  }

  if (kind === "package_performance") {
    const q = supabase.from("bookings")
      .select("total_price, payment_status, tour_packages(package_name, base_price)")
      .gte("booking_date", range.from).lte("booking_date", range.to);
    const { data } = await scope(q);
    const map = new Map<string, Row>();
    (data ?? []).forEach((b) => {
      const pkg = (b as unknown as { tour_packages: { package_name: string } | null }).tour_packages;
      const name = pkg?.package_name ?? "Unknown";
      const cur = map.get(name) ?? { package: name, bookings: 0, paid: 0, revenue: 0 };
      cur.bookings = (cur.bookings as number) + 1;
      if (b.payment_status === "paid") { cur.paid = (cur.paid as number) + 1; cur.revenue = (cur.revenue as number) + Number(b.total_price); }
      map.set(name, cur);
    });
    const rows = [...map.values()].sort((a, b) => (b.revenue as number) - (a.revenue as number));
    return {
      rows,
      cols: [
        { key: "package", header: "Package" },
        { key: "bookings", header: "Bookings" },
        { key: "paid", header: "Paid" },
        { key: "revenue", header: "Revenue (RM)", format: (r) => Number(r.revenue).toFixed(2) },
      ],
      summary: [
        { label: "Packages sold", value: rows.length },
        { label: "Total bookings", value: rows.reduce((s, r) => s + (r.bookings as number), 0) },
        { label: "Total revenue", value: money(rows.reduce((s, r) => s + (r.revenue as number), 0)) },
      ],
    };
  }

  if (kind === "rider_performance") {
    const q = supabase.from("bookings")
      .select("total_price, booking_status, riders(name, rider_code, rating, total_rides)")
      .gte("booking_date", range.from).lte("booking_date", range.to).not("rider_id", "is", null);
    const { data } = await scope(q);
    const map = new Map<string, Row>();
    (data ?? []).forEach((b) => {
      const r = (b as unknown as { riders: { name: string; rider_code: string | null; rating: number | null; total_rides: number | null } | null }).riders;
      if (!r) return;
      const cur = map.get(r.name) ?? { rider: r.name, code: r.rider_code ?? "", completed: 0, cancelled: 0, revenue: 0, rating: Number(r.rating ?? 0) };
      if (b.booking_status === "ride_completed") { cur.completed = (cur.completed as number) + 1; cur.revenue = (cur.revenue as number) + Number(b.total_price); }
      if (b.booking_status === "cancelled") cur.cancelled = (cur.cancelled as number) + 1;
      map.set(r.name, cur);
    });
    const rows = [...map.values()].sort((a, b) => (b.completed as number) - (a.completed as number));
    return {
      rows,
      cols: [
        { key: "rider", header: "Rider" },
        { key: "code", header: "Code" },
        { key: "completed", header: "Completed" },
        { key: "cancelled", header: "Cancelled" },
        { key: "revenue", header: "Revenue (RM)", format: (r) => Number(r.revenue).toFixed(2) },
        { key: "rating", header: "Rating", format: (r) => Number(r.rating).toFixed(1) },
      ],
      summary: [
        { label: "Active riders", value: rows.length },
        { label: "Trips completed", value: rows.reduce((s, r) => s + (r.completed as number), 0) },
        { label: "Revenue generated", value: money(rows.reduce((s, r) => s + (r.revenue as number), 0)) },
      ],
    };
  }

  if (kind === "hub_performance") {
    const q = supabase.from("bookings")
      .select("total_price, booking_status, payment_status, hubs:pickup_hub_id(name)")
      .gte("booking_date", range.from).lte("booking_date", range.to);
    const { data } = await scope(q);
    const map = new Map<string, Row>();
    (data ?? []).forEach((b) => {
      const h = (b as unknown as { hubs: { name: string } | null }).hubs;
      const name = h?.name ?? "Unassigned";
      const cur = map.get(name) ?? { hub: name, bookings: 0, completed: 0, revenue: 0 };
      cur.bookings = (cur.bookings as number) + 1;
      if (b.booking_status === "ride_completed") cur.completed = (cur.completed as number) + 1;
      if (b.payment_status === "paid") cur.revenue = (cur.revenue as number) + Number(b.total_price);
      map.set(name, cur);
    });
    const rows = [...map.values()].sort((a, b) => (b.revenue as number) - (a.revenue as number));
    return {
      rows,
      cols: [
        { key: "hub", header: "Hub" },
        { key: "bookings", header: "Bookings" },
        { key: "completed", header: "Completed" },
        { key: "revenue", header: "Revenue (RM)", format: (r) => Number(r.revenue).toFixed(2) },
      ],
      summary: [
        { label: "Hubs active", value: rows.length },
        { label: "Total bookings", value: rows.reduce((s, r) => s + (r.bookings as number), 0) },
        { label: "Revenue", value: money(rows.reduce((s, r) => s + (r.revenue as number), 0)) },
      ],
    };
  }

  if (kind === "payment_summary") {
    const { data } = await supabase.from("payments")
      .select("payment_method, status, amount, created_at, bookings!inner(booking_no, pickup_hub_id)")
      .gte("created_at", `${range.from}T00:00:00`).lte("created_at", `${range.to}T23:59:59`);
    const list = (data ?? []).filter((p) => {
      if (!hubIds) return true;
      const bk = (p as unknown as { bookings: { pickup_hub_id: string | null } | null }).bookings;
      return bk?.pickup_hub_id && hubIds.includes(bk.pickup_hub_id);
    });
    const map = new Map<string, Row>();
    list.forEach((p) => {
      const k = p.payment_method;
      const cur = map.get(k) ?? { method: k, transactions: 0, paid: 0, failed: 0, amount: 0 };
      cur.transactions = (cur.transactions as number) + 1;
      if (p.status === "success" || p.status === "paid") { cur.paid = (cur.paid as number) + 1; cur.amount = (cur.amount as number) + Number(p.amount); }
      if (p.status === "failed") cur.failed = (cur.failed as number) + 1;
      map.set(k, cur);
    });
    const rows = [...map.values()];
    return {
      rows,
      cols: [
        { key: "method", header: "Method" },
        { key: "transactions", header: "Transactions" },
        { key: "paid", header: "Paid" },
        { key: "failed", header: "Failed" },
        { key: "amount", header: "Amount (RM)", format: (r) => Number(r.amount).toFixed(2) },
      ],
      summary: [
        { label: "Transactions", value: list.length },
        { label: "Collected", value: money(rows.reduce((s, r) => s + (r.amount as number), 0)) },
      ],
    };
  }

  if (kind === "waiting_list") {
    const { data } = await supabase.from("waiting_list")
      .select("status, queue_number, booking_date, created_at, tour_packages(package_name), profiles!waiting_list_customer_id_fkey(name)")
      .gte("booking_date", range.from).lte("booking_date", range.to)
      .order("created_at", { ascending: false });
    const rows: Row[] = (data ?? []).map((w) => {
      const wr = w as unknown as { status: string; queue_number: number; booking_date: string; created_at: string;
        tour_packages: { package_name: string } | null; profiles: { name: string } | null };
      return {
        date: wr.booking_date, customer: wr.profiles?.name ?? "—",
        package: wr.tour_packages?.package_name ?? "—",
        queue: wr.queue_number, status: wr.status, requested: new Date(wr.created_at).toLocaleString(),
      };
    });
    return {
      rows,
      cols: [
        { key: "date", header: "Booking date" },
        { key: "customer", header: "Customer" },
        { key: "package", header: "Package" },
        { key: "queue", header: "Queue #" },
        { key: "status", header: "Status" },
        { key: "requested", header: "Requested at" },
      ],
      summary: [
        { label: "Total entries", value: rows.length },
        { label: "Still waiting", value: rows.filter((r) => r.status === "waiting").length },
        { label: "Notified", value: rows.filter((r) => r.status === "notified").length },
      ],
    };
  }

  if (kind === "customer_ratings") {
    const { data } = await supabase.from("reviews")
      .select("rating, comment, created_at, bookings!inner(booking_no, pickup_hub_id, tour_packages(package_name), riders(name)), profiles!reviews_tourist_id_fkey(name)")
      .gte("created_at", `${range.from}T00:00:00`).lte("created_at", `${range.to}T23:59:59`)
      .order("created_at", { ascending: false });
    const list = (data ?? []).filter((r) => {
      if (!hubIds) return true;
      const bk = (r as unknown as { bookings: { pickup_hub_id: string | null } | null }).bookings;
      return bk?.pickup_hub_id && hubIds.includes(bk.pickup_hub_id);
    });
    const rows: Row[] = list.map((r) => {
      const rr = r as unknown as { rating: number; comment: string | null; created_at: string;
        bookings: { booking_no: string; tour_packages: { package_name: string } | null; riders: { name: string } | null } | null;
        profiles: { name: string } | null };
      return {
        date: new Date(rr.created_at).toISOString().slice(0, 10),
        booking: rr.bookings?.booking_no ?? "",
        customer: rr.profiles?.name ?? "—",
        package: rr.bookings?.tour_packages?.package_name ?? "—",
        rider: rr.bookings?.riders?.name ?? "—",
        rating: rr.rating, comment: rr.comment ?? "",
      };
    });
    const avg = list.length ? list.reduce((s, r) => s + Number(r.rating), 0) / list.length : 0;
    return {
      rows,
      cols: [
        { key: "date", header: "Date" },
        { key: "booking", header: "Booking" },
        { key: "customer", header: "Customer" },
        { key: "package", header: "Package" },
        { key: "rider", header: "Rider" },
        { key: "rating", header: "Rating" },
        { key: "comment", header: "Comment" },
      ],
      summary: [
        { label: "Reviews", value: list.length },
        { label: "Average rating", value: avg.toFixed(2) },
        { label: "5-star", value: list.filter((r) => Number(r.rating) === 5).length },
      ],
    };
  }

  return { rows: [], cols: [], summary: [] };
}
