import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { money } from "@/lib/format";
import {
  Users, Bike, UserCog, MapPin, Package as PackageIcon, Calendar, PlayCircle,
  CheckCircle2, Clock, DollarSign, TrendingUp, Star, LayoutDashboard, AlertOctagon,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { isSuperAdmin, hubIds } = useAuth();
  return isSuperAdmin ? <SuperAdminDashboard /> : <HubAdminDashboard hubIds={hubIds} />;
}

/* ============================================================ */

function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0, riders: 0, hubAdmins: 0, hubs: 0, packages: 0,
    todayBookings: 0, activeTrips: 0, completed: 0, waiting: 0,
    totalRevenue: 0, monthlyRevenue: 0,
  });
  const [popular, setPopular] = useState<Array<{ name: string; bookings: number; revenue: number }>>([]);
  const [topRiders, setTopRiders] = useState<Array<{ name: string; code: string; trips: number; rating: number }>>([]);
  const [pulse, setPulse] = useState<{ sos: number; alerts: string[] }>({ sos: 0, alerts: [] });

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";
    const active = ["rider_assigned", "accepted", "on_the_way", "customer_checked_in", "safety_briefing_completed", "ride_started"];

    const [
      customers, riders, hubAdmins, hubs, packages,
      todayB, activeB, done, waiting, revenue, monthRev, sos,
      pkgRows, riderRows,
    ] = await Promise.all([
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("riders").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "hub_admin"),
      supabase.from("hubs").select("*", { count: "exact", head: true }),
      supabase.from("tour_packages").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("booking_date", today),
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("booking_status", active),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("booking_status", "ride_completed"),
      supabase.from("waiting_list").select("*", { count: "exact", head: true }).eq("status", "waiting"),
      supabase.from("bookings").select("total_price").eq("payment_status", "paid"),
      supabase.from("bookings").select("total_price").eq("payment_status", "paid").gte("booking_date", monthStart),
      supabase.from("sos_alerts").select("id, created_at, bookings(booking_no)").eq("status", "open"),
      supabase.from("bookings").select("total_price, tour_packages(package_name)").eq("payment_status", "paid").limit(500),
      supabase.from("bookings").select("riders(name, rider_code, rating)").eq("booking_status", "ride_completed").not("rider_id", "is", null).limit(500),
    ]);

    setStats({
      customers: customers.count ?? 0,
      riders: riders.count ?? 0,
      hubAdmins: hubAdmins.count ?? 0,
      hubs: hubs.count ?? 0,
      packages: packages.count ?? 0,
      todayBookings: todayB.count ?? 0,
      activeTrips: activeB.count ?? 0,
      completed: done.count ?? 0,
      waiting: waiting.count ?? 0,
      totalRevenue: (revenue.data ?? []).reduce((s, b) => s + Number(b.total_price), 0),
      monthlyRevenue: (monthRev.data ?? []).reduce((s, b) => s + Number(b.total_price), 0),
    });

    const pkgMap = new Map<string, { name: string; bookings: number; revenue: number }>();
    (pkgRows.data ?? []).forEach((b) => {
      const pkg = (b as unknown as { tour_packages: { package_name: string } | null }).tour_packages;
      const name = pkg?.package_name ?? "Unknown";
      const cur = pkgMap.get(name) ?? { name, bookings: 0, revenue: 0 };
      cur.bookings += 1; cur.revenue += Number(b.total_price);
      pkgMap.set(name, cur);
    });
    setPopular([...pkgMap.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 5));

    const riderMap = new Map<string, { name: string; code: string; trips: number; rating: number }>();
    (riderRows.data ?? []).forEach((b) => {
      const r = (b as unknown as { riders: { name: string; rider_code: string | null; rating: number | null } | null }).riders;
      if (!r) return;
      const cur = riderMap.get(r.name) ?? { name: r.name, code: r.rider_code ?? "", trips: 0, rating: Number(r.rating ?? 0) };
      cur.trips += 1;
      riderMap.set(r.name, cur);
    });
    setTopRiders([...riderMap.values()].sort((a, b) => b.trips - a.trips).slice(0, 5));

    setPulse({
      sos: sos.data?.length ?? 0,
      alerts: (sos.data ?? []).slice(0, 3).map((s) => {
        const bk = (s as unknown as { bookings: { booking_no: string } | null }).bookings;
        return bk?.booking_no ?? "";
      }).filter(Boolean),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: "Customers", value: stats.customers, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Riders", value: stats.riders, icon: Bike, tone: "bg-secondary/10 text-secondary" },
    { label: "Hub admins", value: stats.hubAdmins, icon: UserCog, tone: "bg-accent/30 text-foreground" },
    { label: "Hubs", value: stats.hubs, icon: MapPin, tone: "bg-warning/10 text-warning" },
    { label: "Packages", value: stats.packages, icon: PackageIcon, tone: "bg-success/10 text-success" },
    { label: "Today's bookings", value: stats.todayBookings, icon: Calendar, tone: "bg-primary/10 text-primary" },
    { label: "Active trips", value: stats.activeTrips, icon: PlayCircle, tone: "bg-warning/10 text-warning" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Waiting list", value: stats.waiting, icon: Clock, tone: "bg-muted text-muted-foreground" },
    { label: "Monthly revenue", value: money(stats.monthlyRevenue), icon: TrendingUp, tone: "bg-success/10 text-success" },
    { label: "Total revenue", value: money(stats.totalRevenue), icon: DollarSign, tone: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Super Admin Dashboard"
        subtitle="System-wide overview across all hubs"
        icon={LayoutDashboard}
      />

      {pulse.sos > 0 && (
        <Link to="/admin/sos"
          className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/30 p-4 hover:bg-destructive/15 transition">
          <AlertOctagon className="w-5 h-5 text-destructive animate-pulse" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">{pulse.sos} active SOS alert{pulse.sos > 1 ? "s" : ""}</div>
            <div className="text-xs text-destructive/80">{pulse.alerts.join(" · ")}</div>
          </div>
          <span className="text-xs font-medium text-destructive">Respond →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${c.tone}`}><c.icon className="w-4 h-4" /></div>
              <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Popular packages</div>
              <Link to="/admin/packages" className="text-xs text-primary hover:underline">All packages →</Link>
            </div>
            <div className="space-y-2">
              {popular.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No paid bookings yet.</div>}
              {popular.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">#{i + 1}</span>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.bookings} bookings</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-success">{money(p.revenue)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Top riders</div>
              <Link to="/admin/riders" className="text-xs text-primary hover:underline">All riders →</Link>
            </div>
            <div className="space-y-2">
              {topRiders.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No completed trips yet.</div>}
              {topRiders.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-secondary/10 text-secondary font-bold text-sm">#{i + 1}</span>
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{r.trips} trips</div>
                    <div className="text-xs flex items-center gap-1 justify-end text-warning"><Star className="w-3 h-3 fill-warning" /> {r.rating.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ */

function HubAdminDashboard({ hubIds }: { hubIds: string[] }) {
  const [stats, setStats] = useState({
    todayBookings: 0, activeTrips: 0, completed: 0,
    available: 0, busy: 0, waiting: 0, pendingCheckin: 0, dailyRevenue: 0,
  });
  const [chart, setChart] = useState<Array<{ date: string; bookings: number; revenue: number }>>([]);
  const [hubNames, setHubNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (hubIds.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const active = ["rider_assigned", "accepted", "on_the_way", "customer_checked_in", "safety_briefing_completed", "ride_started"];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStart = weekAgo.toISOString().slice(0, 10);

    const [hubs, todayB, activeB, done, riders, waiting, dailyRev, weekly] = await Promise.all([
      supabase.from("hubs").select("name").in("id", hubIds),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("booking_date", today).in("pickup_hub_id", hubIds),
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("booking_status", active).in("pickup_hub_id", hubIds),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("booking_status", "ride_completed").in("pickup_hub_id", hubIds),
      supabase.from("riders").select("status").in("hub_id", hubIds),
      supabase.from("waiting_list").select("*", { count: "exact", head: true }).eq("status", "waiting"),
      supabase.from("bookings").select("total_price, booking_status").eq("booking_date", today).eq("payment_status", "paid").in("pickup_hub_id", hubIds),
      supabase.from("bookings").select("booking_date, total_price, payment_status").gte("booking_date", weekStart).in("pickup_hub_id", hubIds),
    ]);

    setHubNames((hubs.data ?? []).map((h) => h.name));

    const riderRows = riders.data ?? [];
    const pendingCheckin = (dailyRev.data ?? []).filter((b) => b.booking_status === "paid").length;

    setStats({
      todayBookings: todayB.count ?? 0,
      activeTrips: activeB.count ?? 0,
      completed: done.count ?? 0,
      available: riderRows.filter((r) => r.status === "available").length,
      busy: riderRows.filter((r) => r.status === "busy").length,
      waiting: waiting.count ?? 0,
      pendingCheckin,
      dailyRevenue: (dailyRev.data ?? []).reduce((s, b) => s + Number(b.total_price), 0),
    });

    const byDay = new Map<string, { date: string; bookings: number; revenue: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      byDay.set(k, { date: k, bookings: 0, revenue: 0 });
    }
    (weekly.data ?? []).forEach((b) => {
      const day = byDay.get(b.booking_date);
      if (!day) return;
      day.bookings += 1;
      if (b.payment_status === "paid") day.revenue += Number(b.total_price);
    });
    setChart([...byDay.values()]);
  }, [hubIds]);

  useEffect(() => { load(); }, [load]);

  if (hubIds.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No hub assigned yet. Contact a super admin.
      </div>
    );
  }

  const cards = [
    { label: "Today's bookings", value: stats.todayBookings, icon: Calendar, tone: "bg-primary/10 text-primary" },
    { label: "Active trips", value: stats.activeTrips, icon: PlayCircle, tone: "bg-warning/10 text-warning" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Available riders", value: stats.available, icon: Bike, tone: "bg-success/10 text-success" },
    { label: "Busy riders", value: stats.busy, icon: Bike, tone: "bg-warning/10 text-warning" },
    { label: "Pending check-in", value: stats.pendingCheckin, icon: Clock, tone: "bg-primary/10 text-primary" },
    { label: "Waiting list", value: stats.waiting, icon: Clock, tone: "bg-muted text-muted-foreground" },
    { label: "Daily revenue", value: money(stats.dailyRevenue), icon: DollarSign, tone: "bg-success/10 text-success" },
  ];

  const maxRevenue = Math.max(1, ...chart.map((c) => c.revenue));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Hub Dashboard" subtitle={hubNames.join(" · ")} icon={LayoutDashboard} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${c.tone}`}><c.icon className="w-4 h-4" /></div>
              <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5">
          <div className="font-semibold mb-4">Hub performance · last 7 days</div>
          <div className="flex items-end gap-2 h-40">
            {chart.map((c) => (
              <div key={c.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-full">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60"
                       style={{ height: `${(c.revenue / maxRevenue) * 100}%`, minHeight: c.revenue > 0 ? 6 : 0 }} />
                </div>
                <div className="text-[10px] text-muted-foreground">{c.date.slice(5)}</div>
                <div className="text-[10px] font-medium">{c.bookings}b</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center">Bars sized by revenue · counts show bookings</div>
        </CardContent>
      </Card>
    </div>
  );
}
