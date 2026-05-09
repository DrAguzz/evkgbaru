import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDate, fmtTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Bike, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

interface Stats { totalBookings: number; revenue: number; activeRiders: number; completed: number; pending: number; inProgress: number; }
interface Recent { id: string; booking_no: string; booking_date: string; booking_time: string; total_price: number; booking_status: string; tour_packages: { package_name: string } | null; profiles: { name: string } | null; }

function AdminDashboard() {
  const [s, setS] = useState<Stats>({ totalBookings: 0, revenue: 0, activeRiders: 0, completed: 0, pending: 0, inProgress: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      const { data: bookings } = await supabase.from("bookings").select("total_price, payment_status, booking_status");
      const { data: riders } = await supabase.from("riders").select("status");
      const totalBookings = bookings?.length ?? 0;
      const revenue = (bookings ?? []).filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_price), 0);
      const completed = (bookings ?? []).filter((b) => b.booking_status === "completed").length;
      const pending = (bookings ?? []).filter((b) => ["pending", "paid", "assigned"].includes(b.booking_status)).length;
      const inProgress = (bookings ?? []).filter((b) => b.booking_status === "in_progress").length;
      const activeRiders = (riders ?? []).filter((r) => r.status !== "offline").length;
      setS({ totalBookings, revenue, activeRiders, completed, pending, inProgress });

      const { data: r } = await supabase.from("bookings")
        .select("id, booking_no, booking_date, booking_time, total_price, booking_status, tour_packages(package_name), profiles!bookings_tourist_profile_fkey(name)")
        .order("created_at", { ascending: false }).limit(8);
      setRecent((r ?? []) as unknown as Recent[]);
    })();
  }, []);

  const cards = [
    { label: "Total bookings", value: s.totalBookings, icon: Calendar, color: "bg-primary/10 text-primary" },
    { label: "Revenue", value: money(s.revenue), icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Active riders", value: s.activeRiders, icon: Bike, color: "bg-secondary/10 text-secondary" },
    { label: "Completed", value: s.completed, icon: CheckCircle2, color: "bg-accent/40 text-foreground" },
    { label: "In progress", value: s.inProgress, icon: Clock, color: "bg-warning/10 text-warning" },
    { label: "Awaiting", value: s.pending, icon: AlertCircle, color: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of EV Kg Baru operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${c.color}`}><c.icon className="w-4 h-4" /></div>
              <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Recent bookings</div>
            <Link to="/admin/bookings" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr><th className="py-2 pr-3">Booking</th><th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Package</th><th className="py-2 pr-3">When</th><th className="py-2 pr-3">Total</th><th className="py-2">Status</th></tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-3 font-mono text-xs">{r.booking_no}</td>
                    <td className="py-2 pr-3">{r.profiles?.name}</td>
                    <td className="py-2 pr-3">{r.tour_packages?.package_name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{fmtDate(r.booking_date)} {fmtTime(r.booking_time)}</td>
                    <td className="py-2 pr-3 font-semibold">{money(r.total_price)}</td>
                    <td className="py-2"><StatusBadge status={r.booking_status} /></td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No bookings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
