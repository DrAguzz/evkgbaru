import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime } from "@/lib/format";
import { Calendar, Users } from "lucide-react";

export const Route = createFileRoute("/bookings/")({
  component: MyBookings,
});

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; payment_status: string; booking_status: string;
  tour_packages: { package_name: string; image: string | null } | null;
}

function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/bookings" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_no, booking_date, booking_time, pax, total_price, payment_status, booking_status, tour_packages(package_name, image)")
        .eq("tourist_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">Track all your EV bike tour reservations.</p>
        <div className="mt-6 space-y-4">
          {rows.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-10 text-center">
                <p className="text-muted-foreground">No bookings yet.</p>
                <Link to="/packages"><Button className="mt-4 rounded-full">Browse packages</Button></Link>
              </CardContent>
            </Card>
          ) : rows.map((r) => (
            <Card key={r.id} className="rounded-2xl border-0 shadow-card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-32 bg-muted shrink-0">
                  <img src={r.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{r.booking_no}</div>
                    <div className="font-semibold text-lg">{r.tour_packages?.package_name}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(r.booking_date)} · {fmtTime(r.booking_time)}</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.pax} pax</span>
                    </div>
                    <div className="mt-2 flex gap-2"><StatusBadge status={r.booking_status} /><StatusBadge status={r.payment_status} /></div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{money(r.total_price)}</div>
                    <Link to="/bookings/$id" params={{ id: r.id }}><Button variant="outline" size="sm" className="mt-2 rounded-full">View</Button></Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
