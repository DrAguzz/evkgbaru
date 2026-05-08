import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime, money } from "@/lib/format";
import { Calendar, Users, MapPin, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/rider/")({ component: RiderHome });

interface Row {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string;
  tour_packages: { package_name: string; image: string | null } | null;
  hubs: { name: string } | null;
  profiles: { name: string; phone: string | null } | null;
}

function RiderHome() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [riderName, setRiderName] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data: r } = await supabase.from("riders").select("id, name").eq("user_id", user.id).maybeSingle();
    if (!r) return;
    setRiderName(r.name);
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, tour_packages(package_name, image), hubs:pickup_hub_id(name), profiles!bookings_tourist_id_fkey(name, phone)")
      .eq("rider_id", r.id)
      .in("booking_status", ["assigned", "accepted", "picked_up", "in_progress", "returning", "paid"])
      .order("booking_date").order("booking_time");
    setRows((data ?? []) as unknown as Row[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("rider-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="text-xs text-muted-foreground">Welcome back</div>
      <h1 className="text-2xl font-bold">{riderName || "Rider"}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-hero text-primary-foreground p-4">
          <div className="text-xs opacity-80">Active tours</div>
          <div className="text-3xl font-bold">{rows.length}</div>
        </div>
        <div className="rounded-2xl bg-card shadow-card p-4">
          <div className="text-xs text-muted-foreground">Earnings est.</div>
          <div className="text-2xl font-bold">{money(rows.reduce((s, r) => s + Number(r.total_price) * 0.2, 0))}</div>
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-semibold">Assigned tours</h2>
      {rows.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">No active tours yet.</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <Link key={r.id} to="/rider/tours/$id" params={{ id: r.id }} className="block rounded-2xl bg-card shadow-card overflow-hidden">
            <div className="flex">
              <div className="w-24 h-28 bg-muted shrink-0"><img src={r.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-3 flex-1">
                <div className="text-[10px] text-muted-foreground">{r.booking_no}</div>
                <div className="font-semibold text-sm">{r.tour_packages?.package_name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {fmtDate(r.booking_date)} · {fmtTime(r.booking_time)}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {r.pax} pax · {r.profiles?.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.hubs?.name}</div>
                <div className="mt-1 flex justify-between items-center"><StatusBadge status={r.booking_status} /><ChevronRight className="w-4 h-4 text-muted-foreground" /></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
