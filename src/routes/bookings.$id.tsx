import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { money, fmtDate, fmtTime, labelStatus } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Calendar, Users, MapPin, Phone, MessageCircle, Star, CheckCircle2, Bike, Clock } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings/$id")({
  component: BookingDetail,
});

interface Booking {
  id: string; booking_no: string; booking_date: string; booking_time: string;
  pax: number; total_price: number; payment_status: string; booking_status: string;
  special_request: string | null;
  tour_packages: { package_name: string; image: string | null; duration_minutes: number } | null;
  hubs: { name: string; address: string | null } | null;
  riders: { id: string; name: string; phone: string | null; vehicle_id: string | null; rating: number } | null;
}
interface RouteRow { sequence_no: number; locations: { id: string; name: string } | null; }
interface Progress { location_id: string | null; status: string; arrival_time: string | null; sequence_no: number; }

function BookingDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const [b, setB] = useState<Booking | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [hasReview, setHasReview] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id, booking_no, booking_date, booking_time, pax, total_price, payment_status, booking_status, special_request, package_id, tour_packages(package_name, image, duration_minutes), hubs:pickup_hub_id(name, address), riders(id, name, phone, vehicle_id, rating)")
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

  useEffect(() => {
    if (loading || !user) return;
    void load();
  }, [load, loading, user]);

  // realtime
  useEffect(() => {
    if (loading || !user) return;
    const ch = supabase.channel(`booking-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tour_progress", filter: `booking_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load, loading, user]);

  if (loading || !user || !b) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const currentSeq = progress[progress.length - 1]?.sequence_no ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
            <div className="aspect-[16/6] bg-muted">
              <img src={b.tour_packages?.image ?? ""} alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{b.booking_no}</div>
                  <h1 className="text-2xl font-bold">{b.tour_packages?.package_name}</h1>
                  <div className="mt-2 flex gap-2"><StatusBadge status={b.booking_status} /><StatusBadge status={b.payment_status} /></div>
                </div>
                <div className="text-right"><div className="text-2xl font-bold">{money(b.total_price)}</div></div>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{fmtDate(b.booking_date)} · {fmtTime(b.booking_time)}</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" />{b.pax} pax</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{b.hubs?.name}</div>
              </div>
              {b.special_request && <div className="mt-3 text-sm"><span className="text-muted-foreground">Special request:</span> {b.special_request}</div>}
            </CardContent>
          </Card>

          {/* Route map with live progress */}
          <RouteMap
            title={b.booking_status === "in_progress" ? "Live tracking" : `${routes.length} stops`}
            live={b.booking_status === "in_progress"}
            stops={routes.map((r) => {
              const reached = !!progress.find((p) => p.location_id === r.locations?.id);
              const isCurrent = !reached && r.sequence_no === currentSeq + 1;
              return {
                id: r.locations?.id ?? String(r.sequence_no),
                name: r.locations?.name ?? `Stop ${r.sequence_no}`,
                reached,
                current: isCurrent,
              };
            })}
          />

          {/* Timeline */}
          <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Tour progress</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{progress.length} of {routes.length} checkpoints reached</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{routes.length ? Math.round((progress.length / routes.length) * 100) : 0}%</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700 ease-out"
                  style={{ width: `${routes.length ? (progress.length / routes.length) * 100 : 0}%` }}
                />
              </div>
              <ol className="relative space-y-3">
                {/* Track line */}
                <span className="pointer-events-none absolute left-[18px] top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-border via-border/70 to-border" />
                {/* Filled progress line */}
                <span
                  className="pointer-events-none absolute left-[18px] top-4 w-[3px] rounded-full bg-gradient-to-b from-success via-primary to-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition-all duration-700 ease-out"
                  style={{ height: `calc((100% - 2rem) * ${routes.length ? (Math.max(progress.length - 1, 0) / Math.max(routes.length - 1, 1)) : 0})` }}
                />
                {routes.map((r) => {
                  const reached = progress.find((p) => p.location_id === r.locations?.id);
                  const isCurrent = !reached && r.sequence_no === currentSeq + 1;
                  return (
                    <li key={r.sequence_no} className="relative flex items-stretch gap-4 group/item animate-fade-in">
                      {/* Node */}
                      <div className="relative shrink-0 w-10 flex justify-center pt-2">
                        {isCurrent && (
                          <span className="absolute top-1 w-9 h-9 rounded-full bg-primary/30 animate-ping" />
                        )}
                        <span
                          className={`relative grid place-items-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                            reached
                              ? "bg-success border-success text-success-foreground shadow-[0_0_0_5px_color-mix(in_oklab,var(--success)_18%,transparent)]"
                              : isCurrent
                              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_0_5px_color-mix(in_oklab,var(--primary)_22%,transparent)] scale-110"
                              : "bg-background border-border text-muted-foreground group-hover/item:border-primary/40 group-hover/item:text-primary"
                          }`}
                        >
                          {reached ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <Bike className="w-4 h-4" /> : <span className="text-[11px] font-bold">{r.sequence_no}</span>}
                        </span>
                      </div>
                      {/* Card */}
                      <div
                        className={`relative flex-1 min-w-0 rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm ${
                          isCurrent
                            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent ring-1 ring-primary/30 shadow-md shadow-primary/10"
                            : reached
                            ? "bg-gradient-to-r from-success/10 via-success/5 to-transparent ring-1 ring-success/20"
                            : "bg-muted/40 ring-1 ring-border/60 group-hover/item:bg-muted/70 group-hover/item:ring-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : reached ? "text-foreground" : "text-foreground/80"}`}>
                            {r.locations?.name}
                          </div>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Now
                            </span>
                          )}
                          {reached && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/15 px-2 py-0.5 rounded-full">Done</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {reached
                            ? `Arrived ${reached.arrival_time ? new Date(reached.arrival_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} · ${labelStatus(reached.status)}`
                            : isCurrent
                            ? "Rider heading to this checkpoint"
                            : "Awaiting arrival"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Review */}
          {b.booking_status === "completed" && !hasReview && (
            <Card className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-5 space-y-3">
                <div className="font-semibold">Rate your experience</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReview((r) => ({ ...r, rating: n }))}>
                      <Star className={`w-7 h-7 ${n <= review.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} placeholder="How was your tour?" />
                <Button className="rounded-full" onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase.from("reviews").insert({
                    booking_id: b.id, tourist_id: user.id, rider_id: b.riders?.id ?? null,
                    rating: review.rating, comment: review.comment || null,
                  });
                  if (error) return toast.error(error.message);
                  toast.success("Thanks for your review!"); setHasReview(true);
                }}>Submit review</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          {b.riders ? (
            <Card className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-5 space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Your rider</div>
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-12 h-12 rounded-full bg-hero text-primary-foreground"><Bike className="w-5 h-5" /></div>
                  <div>
                    <div className="font-semibold">{b.riders.name}</div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> {Number(b.riders.rating).toFixed(1)} · {b.riders.vehicle_id}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(`tel:${b.riders!.phone}`)}><Phone className="w-4 h-4 mr-1" /> Call</Button>
                  <Button size="sm" onClick={() => window.open(`https://wa.me/${(b.riders!.phone ?? "").replace(/[^\d]/g, "")}`)}><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                {b.payment_status === "paid" ? "Assigning your rider…" : "Pay to confirm your booking and get a rider assigned."}
                {b.payment_status !== "paid" && (
                  <Link to="/pay/$bookingId" params={{ bookingId: b.id }} className="block">
                    <Button className="rounded-full mt-3">Continue payment</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-5 space-y-2 text-sm">
              <div className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Need help?</div>
              <p className="text-muted-foreground">Contact EVRide support — we're here 9am to 9pm daily.</p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => window.open("https://wa.me/60123456789")}>
                <MessageCircle className="w-4 h-4 mr-1" /> Chat support
              </Button>
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Avg response &lt; 5 min</div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
