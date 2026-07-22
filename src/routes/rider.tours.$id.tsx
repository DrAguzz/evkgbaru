import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtTime, money } from "@/lib/format";
import { ArrowLeft, Phone, MessageCircle, Calendar, Users, MapPin, CheckCircle2, PlayCircle, Flag, Check, X, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { rejectAssignment } from "@/lib/booking";

export const Route = createFileRoute("/rider/tours/$id")({ component: RiderTour });

interface Booking {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; booking_status: string; special_request: string | null;
  package_id: string; rider_id: string; meeting_method: string | null;
  pickup_location_name: string | null; pickup_address: string | null;
  tour_packages: { package_name: string; duration_minutes: number; image: string | null } | null;
  hubs: { name: string; address: string | null } | null;
  profiles: { name: string; phone: string | null } | null;
}
interface RouteRow { sequence_no: number; estimated_minutes: number; locations: { id: string; name: string } | null; }
interface Progress { id: string; location_id: string | null; status: string; sequence_no: number; arrival_time: string | null; remarks: string | null; }
interface CheckIn { checked_in_at: string; payment_verified: boolean; identity_verified: boolean; }
interface Briefing { briefing_time: string; status: string; }

function RiderTour() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [b, setB] = useState<Booking | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [checkin, setCheckin] = useState<CheckIn | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, booking_status, special_request, package_id, rider_id, meeting_method, pickup_location_name, pickup_address, tour_packages(package_name, duration_minutes, image), hubs:pickup_hub_id(name, address), profiles!bookings_tourist_profile_fkey(name, phone)")
      .eq("id", id).single();
    setB(data as unknown as Booking);
    if (data?.package_id) {
      const { data: r } = await supabase.from("package_routes").select("sequence_no, estimated_minutes, locations(id, name)").eq("package_id", data.package_id).order("sequence_no");
      setRoutes((r ?? []) as unknown as RouteRow[]);
    }
    const { data: p } = await supabase.from("tour_progress").select("id, location_id, status, sequence_no, arrival_time, remarks").eq("booking_id", id).order("sequence_no");
    setProgress(p ?? []);
    const { data: ci } = await supabase.from("check_ins").select("checked_in_at, payment_verified, identity_verified").eq("booking_id", id).maybeSingle();
    setCheckin(ci as CheckIn | null);
    const { data: br } = await supabase.from("safety_briefings").select("briefing_time, status").eq("booking_id", id).maybeSingle();
    setBriefing(br as Briefing | null);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`rider-tour-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `booking_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "safety_briefings", filter: `booking_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  if (!b || !user) return <div className="grid place-items-center h-full pt-20">Loading…</div>;

  const nextSeq = (progress[progress.length - 1]?.sequence_no ?? 0) + 1;
  const nextRoute = routes.find((r) => r.sequence_no === nextSeq);
  const allDone = progress.length >= routes.length && routes.length > 0;

  async function notifyCustomer(title: string, message: string, type: string) {
    const { data } = await supabase.from("bookings").select("tourist_id").eq("id", id).single();
    if (data?.tourist_id) {
      await supabase.from("notifications").insert({ user_id: data.tourist_id, title, message, type, status: "unread" });
    }
  }

  async function setStatus(status: string, note?: { t: string; m: string; type: string }) {
    setBusy(true);
    await supabase.from("bookings").update({ booking_status: status }).eq("id", id);
    if (note) await notifyCustomer(note.t, note.m, note.type);
    setBusy(false); load();
  }
  async function acceptTour() {
    await supabase.from("riders").update({ status: "busy" }).eq("id", b!.rider_id);
    await setStatus("accepted", { t: "Rider accepted", m: `${b?.profiles?.name ? "Your rider" : "Rider"} accepted your booking and is on the way.`, type: "rider_accepted" });
    toast.success("Tour accepted");
  }
  async function onTheWay() { await setStatus("on_the_way"); toast.success("Marked on the way"); }
  async function startRide() {
    await setStatus("ride_started", { t: "Ride started", m: "Your ride has begun. Enjoy!", type: "ride_started" });
    toast.success("Ride started");
  }

  async function rejectTour() {
    if (!b) return;
    if (!confirm("Reject this tour? Another rider will be assigned.")) return;
    setBusy(true);
    await supabase.from("bookings").update({ booking_status: "rejected" }).eq("id", id);
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
    await supabase.from("bookings").update({ booking_status: "ride_completed" }).eq("id", id);
    await supabase.from("riders").update({ status: "available" }).eq("id", b!.rider_id);
    await notifyCustomer("Ride completed", "Thanks for riding with EVRide. Please rate your trip.", "ride_completed");
    setBusy(false); toast.success("Tour completed!"); load();
  }

  const briefingDone = !!briefing || b.booking_status === "safety_briefing_completed" || b.booking_status === "ride_started" || b.booking_status === "ride_completed";
  const checkinDone = !!checkin || briefingDone || b.booking_status === "customer_checked_in";

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
            <div className="flex items-center gap-1 col-span-2"><MapPin className="w-3 h-3" /> {b.meeting_method === "hotel_pickup" ? b.pickup_location_name ?? b.pickup_address : b.hubs?.name}</div>
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

        {/* Pre-ride checklist */}
        <div className="mt-4 rounded-2xl bg-card shadow-card p-4 space-y-2">
          <div className="font-semibold text-sm mb-1">Pre-ride</div>
          <StepRow ok={checkinDone} label="Customer check-in" hint={checkin ? new Date(checkin.checked_in_at).toLocaleTimeString() : "Awaiting hub admin"} />
          <StepRow ok={briefingDone} label="Safety briefing" hint={briefing ? new Date(briefing.briefing_time).toLocaleTimeString() : "Awaiting hub admin"} />
        </div>

        {/* Checkpoints */}
        <div className="mt-4 rounded-2xl bg-card shadow-card p-4">
          <div className="font-semibold mb-3">Checkpoints</div>
          <div className="relative pl-7 space-y-4">
            <span aria-hidden className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
            {routes.map((r) => {
              const done = progress.find((p) => p.sequence_no === r.sequence_no);
              const current = !done && r.sequence_no === nextSeq && b.booking_status === "ride_started";
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

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {b.booking_status === "rider_assigned" && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-full" disabled={busy} onClick={rejectTour}><X className="w-4 h-4 mr-1" /> Reject</Button>
                <Button className="rounded-full" disabled={busy} onClick={acceptTour}><Check className="w-4 h-4 mr-1" /> Accept</Button>
              </div>
            )}
            {b.booking_status === "accepted" && (
              <Button className="w-full rounded-full" disabled={busy} onClick={onTheWay}><Truck className="w-4 h-4 mr-1" /> On the way</Button>
            )}
            {(b.booking_status === "on_the_way" || b.booking_status === "customer_checked_in" || b.booking_status === "safety_briefing_completed") && (
              <Button className="w-full rounded-full" disabled={busy || !briefingDone} onClick={startRide}>
                <PlayCircle className="w-4 h-4 mr-1" />
                {briefingDone ? "Start ride" : "Waiting for briefing…"}
              </Button>
            )}
            {b.booking_status === "ride_started" && !allDone && nextRoute && (
              <>
                <Textarea placeholder="Remarks (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} className="text-sm" rows={2} />
                <Button className="w-full rounded-full" disabled={busy} onClick={checkIn}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Check in at {nextRoute.locations?.name}
                </Button>
              </>
            )}
            {b.booking_status === "ride_started" && allDone && (
              <Button className="w-full rounded-full" disabled={busy} onClick={completeTour}><Flag className="w-4 h-4 mr-1" /> Complete ride</Button>
            )}
            {b.booking_status === "ride_completed" && (
              <div className="text-center text-sm text-success font-medium py-2">✓ Ride completed</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`grid place-items-center w-6 h-6 rounded-full ${ok ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
        {ok ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
      </span>
      <div className="flex-1">
        <div className={ok ? "font-medium" : "text-muted-foreground"}>{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}
