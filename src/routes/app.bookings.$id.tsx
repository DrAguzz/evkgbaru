import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime, labelStatus } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Calendar, Users, MapPin, Phone, MessageCircle, Star, CheckCircle2, Bike, Clock, AlertOctagon } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/app/bookings/$id")({ component: AppBookingDetail });

interface Booking {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; payment_status: string; booking_status: string;
  special_request: string | null; notes: string | null;
  meeting_method: string | null;
  pickup_location_name: string | null; pickup_address: string | null;
  pickup_distance_km: number | null; pickup_fee: number | null;
  insurance_provider: string | null; insurance_policy_no: string | null;
  insurance_coverage_date: string | null; insurance_status: string | null;
  tour_packages: { package_name: string; image: string | null; duration_minutes: number } | null;
  hubs: { name: string; address: string | null } | null;
  riders: { id: string; name: string; phone: string | null; vehicle_id: string | null; rating: number } | null;
}

interface RouteRow { sequence_no: number; locations: { id: string; name: string } | null; }
interface Progress { location_id: string | null; status: string; arrival_time: string | null; sequence_no: number; }

function AppBookingDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [b, setB] = useState<Booking | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [hasReview, setHasReview] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, payment_status, booking_status, special_request, notes, meeting_method, pickup_location_name, pickup_address, pickup_distance_km, pickup_fee, insurance_provider, insurance_policy_no, insurance_coverage_date, insurance_status, package_id, tour_packages(package_name, image, duration_minutes), hubs:pickup_hub_id(name, address), riders(id, name, phone, vehicle_id, rating)")
      .eq("id", id).single();
    setB(data as unknown as Booking);
    const pkgId = (data as { package_id?: string } | null)?.package_id;
    if (pkgId) {
      const { data: r } = await supabase.from("package_routes").select("sequence_no, locations(id, name)").eq("package_id", pkgId).order("sequence_no");
      setRoutes((r ?? []) as unknown as RouteRow[]);
    }
    const { data: p } = await supabase.from("tour_progress").select("location_id, status, arrival_time, sequence_no").eq("booking_id", id).order("sequence_no");
    setProgress(p ?? []);
    const { data: rev } = await supabase.from("reviews").select("id").eq("booking_id", id).maybeSingle();
    setHasReview(!!rev);
  }, [id]);

  useEffect(() => { if (!loading && user) void load(); }, [load, loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    const ch = supabase.channel(`app-booking-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tour_progress", filter: `booking_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load, loading, user]);

  if (!b) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;

  const currentSeq = progress[progress.length - 1]?.sequence_no ?? 0;
  const pct = routes.length ? (progress.length / routes.length) * 100 : 0;

  return (
    <div className="pb-8 animate-fade-in">
      {/* Hero image header */}
      <div className="relative">
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          {b.tour_packages?.image && <img src={b.tour_packages.image} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>
        <button onClick={() => navigate({ to: "/app/bookings" })} className="absolute top-4 left-4 grid place-items-center w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md active:scale-95 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="text-[10px] uppercase tracking-wider opacity-80">{b.booking_no}</div>
          <h1 className="text-xl font-bold leading-tight line-clamp-2">{b.tour_packages?.package_name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={b.booking_status} className="bg-white/25 text-white border-white/30" />
            <StatusBadge status={b.payment_status} className="bg-white/25 text-white border-white/30" />
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Quick info card */}
        <div className="rounded-2xl bg-card ring-1 ring-border/40 shadow-card p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
            <span className="font-medium">{fmtDate(b.booking_date)} · {fmtTime(b.booking_time)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2"><Users className="w-4 h-4" /> Pax</span>
            <span className="font-medium">{b.pax}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Pickup</span>
            <span className="font-medium text-right line-clamp-1">{b.hubs?.name}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-primary text-lg">{money(b.total_price)}</span>
          </div>
          {b.special_request && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <span className="font-medium text-foreground">Note:</span> {b.special_request}
            </div>
          )}
        </div>

        {/* Meeting / Pickup */}
        {b.meeting_method === "hotel_pickup" && (
          <div className="rounded-2xl bg-card ring-1 ring-border/40 shadow-card p-4 space-y-2 text-sm">
            <div className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Hotel pickup</div>
            <div>{b.pickup_location_name}</div>
            <div className="text-xs text-muted-foreground">{b.pickup_address}</div>
            <div className="flex justify-between pt-2 border-t text-xs">
              <span className="text-muted-foreground">{b.pickup_distance_km} km</span>
              <span className="font-medium">{money(b.pickup_fee ?? 0)}</span>
            </div>
          </div>
        )}

        {/* Insurance */}
        {b.insurance_status === "active" && (
          <div className="rounded-2xl bg-success/5 ring-1 ring-success/20 p-4 space-y-1 text-sm">
            <div className="font-semibold flex items-center gap-2 text-success">Daily insurance active</div>
            <div className="text-xs text-muted-foreground">{b.insurance_provider}</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Policy</span>
              <span className="font-mono">{b.insurance_policy_no}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Coverage</span>
              <span>{b.insurance_coverage_date && fmtDate(b.insurance_coverage_date)}</span>
            </div>
          </div>
        )}

        {/* Cancel */}
        {["pending_payment","paid","waiting_rider_assignment","rider_assigned"].includes(b.booking_status) && (
          <Button variant="outline" className="w-full rounded-full text-destructive border-destructive/40"
            onClick={async () => {
              if (!confirm("Cancel this booking?")) return;
              const { error } = await supabase.from("bookings").update({ booking_status: "cancelled" }).eq("id", b.id);
              if (error) return toast.error(error.message);
              await supabase.from("notifications").insert({
                user_id: user!.id, title: "Booking cancelled",
                message: `${b.booking_no} has been cancelled.`, type: "booking_cancelled", status: "unread",
              });
              toast.success("Booking cancelled");
              void load();
            }}>Cancel booking</Button>
        )}



        {/* Rider card */}
        {b.riders ? (
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 ring-1 ring-primary/20 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your rider</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="grid place-items-center w-12 h-12 rounded-full bg-hero text-primary-foreground"><Bike className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{b.riders.name}</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> {Number(b.riders.rating).toFixed(1)} · {b.riders.vehicle_id}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(`tel:${b.riders!.phone}`)}><Phone className="w-4 h-4 mr-1" /> Call</Button>
              <Button size="sm" className="rounded-full" onClick={() => window.open(`https://wa.me/${(b.riders!.phone ?? "").replace(/[^\d]/g, "")}`)}><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {b.payment_status === "paid" ? "Assigning your rider…" : "Pay to confirm and get your rider."}
            {b.payment_status !== "paid" && (
              <Link to="/pay/$bookingId" params={{ bookingId: b.id }} className="block mt-3">
                <Button className="rounded-full w-full">Continue payment</Button>
              </Link>
            )}
          </div>
        )}

        {/* Map */}
        <RouteMap
          title={b.booking_status === "ride_started" ? "Live tracking" : `${routes.length} stops`}
          live={b.booking_status === "ride_started"}
          stops={routes.map((r) => {
            const reached = !!progress.find((p) => p.location_id === r.locations?.id);
            const isCurrent = !reached && r.sequence_no === currentSeq + 1;
            return { id: r.locations?.id ?? String(r.sequence_no), name: r.locations?.name ?? `Stop ${r.sequence_no}`, reached, current: isCurrent };
          })}
        />

        {/* Progress */}
        <div className="rounded-2xl bg-card ring-1 ring-border/40 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-primary" /> Tour progress</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{progress.length}/{routes.length} checkpoints</div>
            </div>
            <div className="text-xl font-bold text-primary">{Math.round(pct)}%</div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <ol className="relative pl-7">
            <span className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />
            {routes.map((r, idx) => {
              const reached = progress.find((p) => p.location_id === r.locations?.id);
              const isCurrent = !reached && r.sequence_no === currentSeq + 1;
              const isLast = idx === routes.length - 1;
              return (
                <li key={r.sequence_no} className={`relative ${isLast ? "" : "pb-4"}`}>
                  <span className={`absolute -left-[19px] top-0 grid place-items-center w-6 h-6 rounded-full border-2 transition-all ${
                    reached ? "bg-success border-success text-success-foreground" :
                    isCurrent ? "bg-primary border-primary text-primary-foreground animate-pulse" :
                    "bg-background border-border text-muted-foreground"
                  }`}>
                    {reached ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <Bike className="w-3 h-3" /> : <span className="text-[10px] font-semibold">{r.sequence_no}</span>}
                  </span>
                  <div className={`rounded-xl px-3 py-2 ${isCurrent ? "bg-primary/5 ring-1 ring-primary/20" : reached ? "bg-success/5" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-sm font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>{r.locations?.name}</div>
                      {isCurrent && <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Now</span>}
                      {reached && <span className="text-[9px] font-bold uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded-full">Done</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {reached ? `Arrived ${reached.arrival_time ? new Date(reached.arrival_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} · ${labelStatus(reached.status)}` :
                       isCurrent ? "Rider heading here" : "Awaiting arrival"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* SOS */}
        {["ride_started", "on_the_way", "customer_checked_in", "safety_briefing_completed"].includes(b.booking_status) && (
          <SOSButton bookingId={b.id} touristId={user?.id ?? ""} riderId={b.riders?.id ?? null} />
        )}

        {/* Review */}
        {b.booking_status === "ride_completed" && !hasReview && (
          <div className="rounded-2xl bg-card ring-1 ring-border/40 shadow-card p-4 space-y-3">
            <div className="font-semibold text-sm">Rate your experience</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReview((r) => ({ ...r, rating: n }))}>
                  <Star className={`w-7 h-7 ${n <= review.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} placeholder="How was your tour?" />
            <Button className="rounded-full w-full" onClick={async () => {
              if (!user) return;
              const { error } = await supabase.from("reviews").insert({
                booking_id: b.id, tourist_id: user.id, rider_id: b.riders?.id ?? null,
                rating: review.rating, comment: review.comment || null,
              });
              if (error) return toast.error(error.message);
              toast.success("Thanks for your review!"); setHasReview(true);
            }}>Submit review</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SOSButton({ bookingId, touristId, riderId }: { bookingId: string; touristId: string; riderId: string | null }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [ice, setIce] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!touristId) return toast.error("Sign in required");
    setSending(true);
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { /* location denied */ }
    const { error } = await supabase.from("sos_alerts").insert({
      booking_id: bookingId, tourist_id: touristId, rider_id: riderId,
      latitude: lat, longitude: lng, message: msg || null, emergency_contact: ice || null, status: "open",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Emergency alert sent. Help is being notified.");
    setOpen(false); setMsg(""); setIce("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-destructive text-destructive-foreground font-bold py-4 shadow-lg active:scale-[.98] transition">
          <AlertOctagon className="w-5 h-5" /> Emergency SOS
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertOctagon className="w-5 h-5" /> Send SOS?</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Your live location will be shared with the hub, your rider and admins. Only use in a real emergency.</p>
          <Textarea placeholder="What's happening? (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Input placeholder="Emergency contact number (optional)" value={ice} onChange={(e) => setIce(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-destructive hover:bg-destructive/90" onClick={send} disabled={sending}>{sending ? "Sending…" : "Send SOS"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
