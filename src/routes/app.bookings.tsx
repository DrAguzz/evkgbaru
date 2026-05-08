import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/app/bookings")({ component: AppBookings });

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string;
  tour_packages: { package_name: string; image: string | null } | null;
}

function AppBookings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, tour_packages(package_name, image)")
      .eq("tourist_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  return (
    <div className="px-5 pt-8 pb-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">No bookings yet.</div>}
        {rows.map((r) => (
          <Link key={r.id} to="/bookings/$id" params={{ id: r.id }} className="block rounded-2xl overflow-hidden bg-card shadow-card">
            <div className="flex">
              <div className="w-24 h-24 bg-muted shrink-0"><img src={r.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-3 flex-1">
                <div className="text-[10px] text-muted-foreground">{r.booking_no}</div>
                <div className="font-semibold text-sm">{r.tour_packages?.package_name}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(r.booking_date)} · {fmtTime(r.booking_time)} · {r.pax} pax</div>
                <div className="mt-1 flex items-center justify-between">
                  <StatusBadge status={r.booking_status} />
                  <span className="font-bold text-sm">{money(r.total_price)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
