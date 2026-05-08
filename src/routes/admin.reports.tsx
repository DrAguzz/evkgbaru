import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { money } from "@/lib/format";
import { TrendingUp, Calendar, Bike, Star, DollarSign, Package as PackageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

interface PkgStat { name: string; bookings: number; revenue: number; }
interface RiderStat { name: string; tours: number; earnings: number; rating: number; }
interface DayStat { date: string; bookings: number; revenue: number; }

function AdminReports() {
  const [pkgStats, setPkgStats] = useState<PkgStat[]>([]);
  const [riderStats, setRiderStats] = useState<RiderStat[]>([]);
  const [dayStats, setDayStats] = useState<DayStat[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, bookings: 0, completed: 0, avgRating: 0 });

  useEffect(() => {
    (async () => {
      const { data: bookings } = await supabase.from("bookings")
        .select("id, total_price, payment_status, booking_status, booking_date, tour_packages(package_name), riders(name, rating)")
        .order("booking_date", { ascending: false });
      const list = (bookings ?? []) as unknown as Array<{
        total_price: number; payment_status: string; booking_status: string; booking_date: string;
        tour_packages: { package_name: string } | null; riders: { name: string; rating: number } | null;
      }>;

      const paid = list.filter((b) => b.payment_status === "paid");
      const completed = list.filter((b) => b.booking_status === "completed");
      const revenue = paid.reduce((s, b) => s + Number(b.total_price), 0);

      const pkgMap = new Map<string, PkgStat>();
      paid.forEach((b) => {
        const n = b.tour_packages?.package_name ?? "Unknown";
        const cur = pkgMap.get(n) ?? { name: n, bookings: 0, revenue: 0 };
        cur.bookings += 1; cur.revenue += Number(b.total_price);
        pkgMap.set(n, cur);
      });
      setPkgStats([...pkgMap.values()].sort((a, b) => b.revenue - a.revenue));

      const riderMap = new Map<string, RiderStat>();
      completed.forEach((b) => {
        if (!b.riders) return;
        const cur = riderMap.get(b.riders.name) ?? { name: b.riders.name, tours: 0, earnings: 0, rating: Number(b.riders.rating) };
        cur.tours += 1; cur.earnings += Number(b.total_price) * 0.2;
        riderMap.set(b.riders.name, cur);
      });
      setRiderStats([...riderMap.values()].sort((a, b) => b.tours - a.tours));

      const dayMap = new Map<string, DayStat>();
      paid.forEach((b) => {
        const d = b.booking_date;
        const cur = dayMap.get(d) ?? { date: d, bookings: 0, revenue: 0 };
        cur.bookings += 1; cur.revenue += Number(b.total_price);
        dayMap.set(d, cur);
      });
      setDayStats([...dayMap.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14));

      const { data: revs } = await supabase.from("reviews").select("rating");
      const avg = revs && revs.length ? revs.reduce((s, r) => s + Number(r.rating), 0) / revs.length : 0;
      setTotals({ revenue, bookings: list.length, completed: completed.length, avgRating: avg });
    })();
  }, []);

  const maxRev = Math.max(1, ...dayStats.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-sm text-muted-foreground">Performance overview</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Total revenue", v: money(totals.revenue), I: DollarSign, c: "bg-success/10 text-success" },
          { l: "Bookings", v: totals.bookings, I: Calendar, c: "bg-primary/10 text-primary" },
          { l: "Completed tours", v: totals.completed, I: TrendingUp, c: "bg-secondary/10 text-secondary" },
          { l: "Avg rating", v: totals.avgRating ? totals.avgRating.toFixed(2) : "—", I: Star, c: "bg-warning/10 text-warning" },
        ].map((c) => (
          <Card key={c.l} className="rounded-2xl border-0 shadow-card"><CardContent className="p-4">
            <div className={`w-9 h-9 rounded-xl grid place-items-center ${c.c}`}><c.I className="w-4 h-4" /></div>
            <div className="mt-3 text-xs text-muted-foreground">{c.l}</div>
            <div className="text-xl font-bold">{c.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
        <div className="font-semibold mb-3">Revenue by day (last 14)</div>
        {dayStats.length === 0 ? <div className="text-sm text-muted-foreground">No data yet.</div> : (
          <div className="space-y-1.5">
            {dayStats.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-xs">
                <div className="w-20 text-muted-foreground">{new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-hero rounded-full" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                </div>
                <div className="w-20 text-right font-medium">{money(d.revenue)}</div>
                <div className="w-12 text-right text-muted-foreground">{d.bookings}x</div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
          <div className="font-semibold mb-3 flex items-center gap-2"><PackageIcon className="w-4 h-4" /> Top packages</div>
          {pkgStats.length === 0 ? <div className="text-sm text-muted-foreground">No data.</div> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase text-left"><tr><th className="py-2">Package</th><th className="py-2 text-right">Bookings</th><th className="py-2 text-right">Revenue</th></tr></thead>
              <tbody>{pkgStats.map((p) => (
                <tr key={p.name} className="border-t"><td className="py-2">{p.name}</td><td className="py-2 text-right">{p.bookings}</td><td className="py-2 text-right font-semibold">{money(p.revenue)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </CardContent></Card>

        <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
          <div className="font-semibold mb-3 flex items-center gap-2"><Bike className="w-4 h-4" /> Top riders</div>
          {riderStats.length === 0 ? <div className="text-sm text-muted-foreground">No completed tours yet.</div> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase text-left"><tr><th className="py-2">Rider</th><th className="py-2 text-right">Tours</th><th className="py-2 text-right">Earnings</th><th className="py-2 text-right">Rating</th></tr></thead>
              <tbody>{riderStats.map((r) => (
                <tr key={r.name} className="border-t"><td className="py-2">{r.name}</td><td className="py-2 text-right">{r.tours}</td><td className="py-2 text-right font-semibold">{money(r.earnings)}</td><td className="py-2 text-right">{r.rating.toFixed(1)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
