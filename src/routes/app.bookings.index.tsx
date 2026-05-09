import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/app/bookings/")({ component: AppBookings });

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string;
  tour_packages: { package_name: string; image: string | null } | null;
}

function AppBookings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const navigate = useNavigate({ from: "/app/bookings" });

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, tour_packages(package_name, image)")
      .eq("tourist_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  return (
    <div className="pb-6">
      {/* Coloured header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-primary/80 text-white rounded-b-[28px] px-5 pt-10 pb-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold leading-tight drop-shadow-sm">My Bookings</h1>
          <p className="text-sm opacity-90 mt-1">Track all your tours in one place.</p>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {rows.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">No bookings yet.</div>}
        {rows.map((r) => (
          <div
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: "/app/bookings/$id", params: { id: r.id } })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate({ to: "/app/bookings/$id", params: { id: r.id } });
              }
            }}
            className="block rounded-2xl overflow-hidden bg-card shadow-card cursor-pointer"
          >
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
          </div>
        ))}
      </div>
    </div>
  );
}
