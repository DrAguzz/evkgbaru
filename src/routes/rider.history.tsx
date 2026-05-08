import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, money } from "@/lib/format";

export const Route = createFileRoute("/rider/history")({ component: RiderHistory });

interface Row {
  id: string; booking_no: string; booking_date: string; total_price: number;
  booking_status: string; pax: number;
  tour_packages: { package_name: string } | null;
}

function RiderHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r } = await supabase.from("riders").select("id").eq("user_id", user.id).maybeSingle();
      if (!r) return;
      const { data } = await supabase.from("bookings")
        .select("id, booking_no, booking_date, total_price, booking_status, pax, tour_packages(package_name)")
        .eq("rider_id", r.id).eq("booking_status", "completed").order("booking_date", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, [user]);

  const earnings = rows.reduce((s, r) => s + Number(r.total_price) * 0.2, 0);

  return (
    <div className="px-5 pt-8 pb-6">
      <h1 className="text-2xl font-bold">History</h1>
      <div className="mt-4 rounded-2xl bg-hero text-primary-foreground p-4">
        <div className="text-xs opacity-80">Total earnings</div>
        <div className="text-3xl font-bold">{money(earnings)}</div>
        <div className="text-xs opacity-80 mt-1">{rows.length} completed tours</div>
      </div>
      <div className="mt-5 space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">No completed tours yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-card shadow-card p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] text-muted-foreground">{r.booking_no}</div>
                <div className="font-semibold text-sm">{r.tour_packages?.package_name}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(r.booking_date)} · {r.pax} pax</div>
              </div>
              <div className="text-right">
                <StatusBadge status={r.booking_status} />
                <div className="mt-1 text-sm font-bold">{money(Number(r.total_price) * 0.2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
