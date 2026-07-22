import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChevronLeft, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/waiting-list")({ component: AppWaitingList });

interface Row {
  id: string; booking_date: string; queue_number: number; status: string; pax: number; respond_by: string | null;
  tour_packages: { package_name: string } | null;
  package_time_slots: { start_time: string } | null;
  package_id: string; time_slot_id: string;
}

function AppWaitingList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("waiting_list")
      .select("id,booking_date,queue_number,status,pax,respond_by,package_id,time_slot_id,tour_packages:package_id(package_name),package_time_slots(start_time)")
      .eq("customer_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  async function confirm(r: Row) {
    // Mark waiting_list confirmed & attempt to create booking
    await supabase.from("waiting_list").update({ status: "confirmed" }).eq("id", r.id);
    toast.success("Confirmed. Complete payment to lock the slot.");
    void load();
  }
  async function cancel(id: string) {
    await supabase.from("waiting_list").update({ status: "cancelled" }).eq("id", id);
    void load();
  }

  return (
    <div className="px-5 pt-8 pb-24">
      <button onClick={() => nav({ to: "/app/profile" })} className="grid place-items-center w-10 h-10 rounded-full bg-accent mb-4">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold mb-4">Waiting list</h1>
      {rows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Hourglass className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm">You're not on any waiting list</div>
        </div>
      )}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{r.tour_packages?.package_name ?? "Package"}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(r.booking_date)} · {r.package_time_slots?.start_time?.slice(0, 5) ?? ""} · {r.pax} pax</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Queue #{r.queue_number}</span>
              {r.respond_by && r.status === "notified" && (
                <span className="text-warning">Respond by {new Date(r.respond_by).toLocaleTimeString()}</span>
              )}
            </div>
            {r.status === "notified" && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button size="sm" onClick={() => confirm(r)}>Confirm</Button>
                <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>Decline</Button>
              </div>
            )}
            {r.status === "waiting" && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(r.id)}>Leave waiting list</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
