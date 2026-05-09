import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime, money } from "@/lib/format";
import { ArrowLeft, Phone, MessageCircle, Calendar, Users, MapPin, CheckCircle2, PlayCircle, Flag, Check, X, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { rejectAssignment } from "@/lib/booking";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/rider/tours/$id")({ component: RiderTour });

interface Booking {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string; special_request: string | null;
  package_id: string; rider_id: string;
  tour_packages: { package_name: string; duration_minutes: number; image: string | null } | null;
  hubs: { name: string; address: string | null } | null;
  profiles: { name: string; phone: string | null } | null;
}
interface RouteRow { sequence_no: number; estimated_minutes: number; locations: { id: string; name: string } | null; }
interface Progress { id: string; location_id: string | null; status: string; sequence_no: number; arrival_time: string | null; remarks: string | null; }

function RiderTour() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [b, setB] = useState<Booking | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, special_request, package_id, rider_id, tour_packages(package_name, duration_minutes, image), hubs:pickup_hub_id(name, address), profiles!bookings_tourist_profile_fkey(name, phone)")
      .eq("id", id).single();
    setB(data as unknown as Booking);
    if (data?.package_id) {
      const { data: r } = await supabase.from("package_routes").select("sequence_no, estimated_minutes, locations(id, name)").eq("package_id", data.package_id).order("sequence_no");
      setRoutes((r ?? []) as unknown as RouteRow[]);
    }
    const { data: p } = await supabase.from("tour_progress").select("id, location_id, status, sequence_no, arrival_time, remarks").eq("booking_id", id).order("sequence_no");
    setProgress(p ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!b || !user) return <div className="grid place-items-center h-full pt-20">Loading…</div>;

  const nextSeq = (progress[progress.length - 1]?.sequence_no ?? 0) + 1;
  const nextRoute = routes.find((r) => r.sequence_no === nextSeq);
  const allDone = progress.length >= routes.length && routes.length > 0;

  async function setStatus(status: string) {
    setBusy(true);
    await supabase.from("bookings").update({ booking_status: status }).eq("id", id);
    setBusy(false); load();
  }
  async function acceptTour() { await setStatus("accepted"); toast.success("Tour accepted"); }
  async function pickup() { await setStatus("picked_up"); toast.success("Customer picked up"); }
  async function startTour() { await setStatus("in_progress"); toast.success("Tour started"); }
  async function returnToHub() { await setStatus("returning"); toast.success("Returning to hub"); }

  async function rejectTour() {
    if (!b) return;
    if (!confirm("Reject this tour? Another rider will be assigned.")) return;
    setBusy(true);
    await rejectAssignment(id, b.rider_id);
    setBusy(false);
    toast.success("Tour rejected — reassigning…");
    navigate({ to: "/rider" });
  }

  async function checkIn() {
    if (!nextRoute || !b) return;
    setBusy(true);
    const { error } = await supabase.from("tour_progress").insert({
      booking_id: id, rider_id: b.rider_id,
      location_id: nextRoute.locations?.id ?? null,
      sequence_no: nextRoute.sequence_no,
      status: "arrived", arrival_time: new Date().toISOString(),
      remarks: remark || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Checked in at ${nextRoute.locations?.name}`);
    setRemark(""); load();
  }

  async function completeTour() {
    setBusy(true);
    await supabase.from("bookings").update({ booking_status: "completed" }).eq("id", id);
    await supabase.from("riders").update({ status: "available" }).eq("id", b!.rider_id);
    setBusy(false); toast.success("Tour completed!"); load();
  }

  return (
    <div className="pb-24">
      <div className="relative h-56 bg-muted overflow-hidden rounded-b-3xl">
        <img src={b.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link to="/rider" className="absolute top-4 left-4 grid place-items-center w-9 h-9 rounded-full bg-background/90 backdrop-blur shadow-card"><ArrowLeft className="w-4 h-4" /></Link>
      </div>

      <div className="px-5 -mt-10 relative">
        <div className="rounded-2xl bg-card shadow-card p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="text-[10px] text-muted-foreground">{b.booking_no}</div>
              <div className="font-bold">{b.tour_packages?.package_name}</div>
            </div>
            <StatusBadge status={b.booking_status} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(b.booking_date)} · {fmtTime(b.booking_time)}</div>
            <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.pax} pax</div>
            <div className="flex items-center gap-1 col-span-2"><MapPin className="w-3 h-3" /> {b.hubs?.name}</div>
          </div>
        </div>

        {/* Customer */}
        <div className="mt-4 rounded-2xl bg-card shadow-card p-4">
          <div className="text-xs text-muted-foreground mb-2">CUSTOMER</div>
          <div className="font-semibold">{b.profiles?.name}</div>
          {b.special_request && <p className="mt-1 text-xs text-muted-foreground">"{b.special_request}"</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`tel:${b.profiles?.phone}`)}><Phone className="w-3.5 h-3.5 mr-1" /> Call</Button>
            <Button size="sm" onClick={() => window.open(`https://wa.me/${(b.profiles?.phone ?? "").replace(/[^\d]/g, "")}`)}><MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp</Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex justify-between"><span>Earnings</span><span className="font-semibold text-foreground">{money(Number(b.total_price) * 0.2)}</span></div>
        </div>

        {/* Checkpoints */}
        <div className="mt-4 rounded-2xl bg-card shadow-card p-4">
          <div className="font-semibold mb-3">Checkpoints</div>
          <div className="relative pl-7 space-y-4">
            <span aria-hidden className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
            {routes.map((r) => {
              const done = progress.find((p) => p.sequence_no === r.sequence_no);
              const current = !done && r.sequence_no === nextSeq && b.booking_status === "in_progress";
              return (
                <div key={r.sequence_no} className="relative">
                  <span className={`absolute -left-[22px] top-0.5 w-4 h-4 rounded-full border-2 ${done ? "bg-success border-success" : current ? "bg-primary border-primary animate-pulse" : "bg-background border-border"}`} />
                  <div className="text-sm font-medium leading-tight">{r.locations?.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {done ? `Arrived ${done.arrival_time ? new Date(done.arrival_time).toLocaleTimeString() : ""}` : `~${r.estimated_minutes} min`}
                  </div>
                  {done?.remarks && <div className="text-xs italic text-muted-foreground mt-0.5">"{done.remarks}"</div>}
                </div>
              );
            })}
          </div>

          {/* Action */}
          <div className="mt-4 space-y-2">
            {b.booking_status === "assigned" && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-full" disabled={busy} onClick={rejectTour}><X className="w-4 h-4 mr-1" /> Reject</Button>
                <Button className="rounded-full" disabled={busy} onClick={acceptTour}><Check className="w-4 h-4 mr-1" /> Accept</Button>
              </div>
            )}
            {b.booking_status === "accepted" && (
              <Button className="w-full rounded-full" disabled={busy} onClick={pickup}><Truck className="w-4 h-4 mr-1" /> Confirm pickup</Button>
            )}
            {b.booking_status === "picked_up" && (
              <Button className="w-full rounded-full" disabled={busy} onClick={startTour}><PlayCircle className="w-4 h-4 mr-1" /> Start tour</Button>
            )}
            {b.booking_status === "in_progress" && !allDone && nextRoute && (
              <>
                <Textarea placeholder="Remarks (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} className="text-sm" rows={2} />
                <Button className="w-full rounded-full" disabled={busy} onClick={checkIn}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Check in at {nextRoute.locations?.name}
                </Button>
              </>
            )}
            {b.booking_status === "in_progress" && allDone && (
              <Button className="w-full rounded-full" disabled={busy} onClick={returnToHub}><Home className="w-4 h-4 mr-1" /> Return to hub</Button>
            )}
            {b.booking_status === "returning" && (
              <Button className="w-full rounded-full" disabled={busy} onClick={completeTour}><Flag className="w-4 h-4 mr-1" /> Complete tour</Button>
            )}
            {b.booking_status === "completed" && (
              <div className="text-center text-sm text-success font-medium py-2">✓ Tour completed</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
