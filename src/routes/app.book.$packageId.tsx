import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, CreditCard, Building2, Wallet, BanknoteIcon, Tag, X,
  MapPin, Home as HomeIcon, ShieldCheck, Bike, Users, Clock, Hourglass,
} from "lucide-react";
import { money } from "@/lib/format";
import { packageToSlug } from "@/lib/package-slug";
import { processMockPayment, haversineKm, getPickupRate, countBookedPax, joinWaitingList } from "@/lib/booking";
import { toast } from "sonner";

interface AppliedPromo { id: string; code: string; discount_type: string; discount_value: number; min_amount: number; }

export const Route = createFileRoute("/app/book/$packageId")({ component: AppBook });

const SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

type Pkg = { id: string; package_name: string; price: number; max_pax: number; start_hub_id: string | null };
type Hub = { id: string; name: string; latitude: number | null; longitude: number | null };

function AppBook() {
  const { packageId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [pickupRate, setPickupRate] = useState(1.5);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [slotUsage, setSlotUsage] = useState<Record<string, number>>({});
  const [pax, setPax] = useState(1);
  const [hub, setHub] = useState("");
  const [meetingMethod, setMeetingMethod] = useState<"walk_in" | "hotel_pickup">("walk_in");
  const [pickupName, setPickupName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState<string>("");
  const [pickupLng, setPickupLng] = useState<string>("");
  const [pickupDistance, setPickupDistance] = useState(0);
  const [pickupFee, setPickupFee] = useState(0);

  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"card" | "chip_in" | "alipay" | "walk_in">("card");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const CAPACITY = pkg?.max_pax ?? 4;

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("tour_packages")
        .select("id,package_name,price,max_pax,start_hub_id").eq("id", packageId).single();
      setPkg(p);
      if (p?.start_hub_id) setHub(p.start_hub_id);
      const { data: h } = await supabase.from("hubs").select("id,name,latitude,longitude").eq("status", "active");
      setHubs(h ?? []);
      setPickupRate(await getPickupRate());
    })();
  }, [packageId]);

  // Load slot capacity when date changes
  useEffect(() => {
    if (!pkg || !date) return;
    (async () => {
      const usage: Record<string, number> = {};
      await Promise.all(SLOTS.map(async (s) => { usage[s] = await countBookedPax(pkg.id, date, s); }));
      setSlotUsage(usage);
    })();
  }, [pkg, date]);

  // Auto pickup fee
  useEffect(() => {
    if (meetingMethod !== "hotel_pickup" || !pickupLat || !pickupLng) {
      setPickupDistance(0); setPickupFee(0); return;
    }
    const currentHub = hubs.find((h) => h.id === hub);
    if (!currentHub?.latitude || !currentHub?.longitude) return;
    const km = haversineKm(
      { lat: Number(currentHub.latitude), lng: Number(currentHub.longitude) },
      { lat: Number(pickupLat), lng: Number(pickupLng) },
    );
    setPickupDistance(Math.round(km * 100) / 100);
    setPickupFee(Math.round(km * pickupRate * 100) / 100);
  }, [meetingMethod, pickupLat, pickupLng, hub, hubs, pickupRate]);

  const subtotal = useMemo(() => (pkg ? pkg.price * pax : 0), [pkg, pax]);
  const discount = useMemo(() => {
    if (!promo) return 0;
    if (promo.discount_type === "percentage") return Math.round(subtotal * (promo.discount_value / 100) * 100) / 100;
    return Math.min(promo.discount_value, subtotal);
  }, [promo, subtotal]);
  const total = Math.max(0, subtotal - discount + pickupFee);

  if (!pkg) return <div className="p-8">Loading…</div>;

  const slotRemaining = time ? Math.max(0, CAPACITY - (slotUsage[time] ?? 0)) : 0;
  const slotFull = time !== "" && slotRemaining < pax;

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoBusy(true);
    const { data, error } = await supabase.from("promo_codes")
      .select("id,code,discount_type,discount_value,min_amount,max_uses,used_count,valid_from,valid_until,status")
      .eq("code", code).maybeSingle();
    setPromoBusy(false);
    if (error || !data) return toast.error("Invalid promo code");
    const now = new Date();
    if (data.status !== "active") return toast.error("Not active");
    if (data.valid_from && new Date(data.valid_from) > now) return toast.error("Not yet valid");
    if (data.valid_until && new Date(data.valid_until) < now) return toast.error("Expired");
    if (data.max_uses != null && data.used_count >= data.max_uses) return toast.error("Usage limit reached");
    if (subtotal < Number(data.min_amount)) return toast.error(`Min spend ${money(Number(data.min_amount))}`);
    setPromo({ id: data.id, code: data.code, discount_type: data.discount_type, discount_value: Number(data.discount_value), min_amount: Number(data.min_amount) });
    toast.success(`Promo "${data.code}" applied`);
  }

  async function handleJoinWaitingList() {
    if (!user || !time) return;
    try {
      const wl = await joinWaitingList({ customerId: user.id, packageId: pkg!.id, date, time, pax });
      await supabase.from("notifications").insert({
        user_id: user.id, title: "Waiting list joined",
        message: `You're #${wl.queue_number} in line for ${pkg!.package_name} on ${date}.`,
        type: "waiting_list", status: "unread",
      });
      toast.success(`Joined waiting list · position #${wl.queue_number}`);
      nav({ to: "/app/waiting-list" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    }
  }

  async function createBooking() {
    if (!user) return;
    setBusy(true);
    const currentHub = hubs.find((h) => h.id === hub);
    const { data, error } = await supabase.from("bookings").insert({
      tourist_id: user.id,
      package_id: pkg!.id,
      hub_id: hub,
      pickup_hub_id: hub,
      booking_date: date,
      booking_time: time,
      pax,
      total_price: total,
      special_request: notes || null,
      notes: notes || null,
      promo_code: promo?.code ?? null,
      discount_amount: discount,
      meeting_method: meetingMethod,
      pickup_location_name: meetingMethod === "hotel_pickup" ? pickupName : null,
      pickup_address: meetingMethod === "hotel_pickup" ? pickupAddress : null,
      pickup_latitude: meetingMethod === "hotel_pickup" ? Number(pickupLat) || null : null,
      pickup_longitude: meetingMethod === "hotel_pickup" ? Number(pickupLng) || null : null,
      pickup_distance_km: pickupDistance,
      pickup_fee: pickupFee,
      booking_status: "pending_payment",
      payment_status: "pending",
    }).select("id, booking_no").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (promo) {
      const { data: cur } = await supabase.from("promo_codes").select("used_count").eq("id", promo.id).single();
      await supabase.from("promo_codes").update({ used_count: (cur?.used_count ?? 0) + 1 }).eq("id", promo.id);
    }
    await supabase.from("notifications").insert({
      user_id: user.id, title: "Booking created",
      message: `${data!.booking_no} awaiting payment.`, type: "booking_created", status: "unread",
    });
    setBookingId(data!.id);
    setStep(5);
    void currentHub;
  }

  async function handlePay() {
    if (!bookingId) return;
    setBusy(true);
    try {
      const res = await processMockPayment(bookingId, method, total);
      if (res.walkIn) toast.success("Booking confirmed. Pay at hub terminal.");
      else toast.success("Paid! Insurance activated. Rider being assigned.");
      nav({ to: "/app/bookings/$id", params: { id: bookingId } });
    } catch (e) {
      await supabase.from("bookings").update({ booking_status: "payment_failed", payment_status: "failed" }).eq("id", bookingId);
      await supabase.from("notifications").insert({
        user_id: user!.id, title: "Payment failed",
        message: "Please try another payment method.", type: "payment_failed", status: "unread",
      });
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally { setBusy(false); }
  }

  const stepTitles = ["", "Choose date & slot", "Vehicle & meeting", "Pickup details", "Review", "Payment"];

  return (
    <div className="px-5 pt-8 pb-24">
      <button
        onClick={() => step > 1 && step < 5 ? setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
          : nav({ to: "/app/packages/$slug", params: { slug: packageToSlug(pkg.package_name) } })}
        className="grid place-items-center w-10 h-10 rounded-full bg-accent mb-4">
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`h-1 flex-1 rounded-full ${step >= n ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <h1 className="text-xl font-bold">{stepTitles[step]}</h1>
      <div className="text-sm text-muted-foreground mb-4">{pkg.package_name}</div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
          </div>
          <div>
            <Label>Pax</Label>
            <Input type="number" min={1} max={pkg.max_pax}
              value={pax} onChange={(e) => setPax(Math.max(1, Math.min(pkg.max_pax, +e.target.value || 1)))} />
          </div>
          <div>
            <Label>Time slot</Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {SLOTS.map((s) => {
                const used = slotUsage[s] ?? 0;
                const remaining = CAPACITY - used;
                const isFull = remaining <= 0;
                const selected = time === s;
                return (
                  <button key={s} type="button" onClick={() => setTime(s)}
                    className={`rounded-xl border p-2 text-xs font-medium transition ${
                      selected ? "border-primary bg-primary/10 text-primary" :
                      isFull ? "border-destructive/30 bg-destructive/5 text-destructive/70" : "hover:border-primary/40"
                    }`}>
                    <div className="font-semibold">{s}</div>
                    <div className="text-[10px] opacity-70">{isFull ? "Full" : `${remaining} left`}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {time && slotFull && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-warning text-sm font-medium">
                <Hourglass className="w-4 h-4" /> This slot is full
              </div>
              <p className="text-xs text-muted-foreground">Join the waiting list — we'll notify you if a spot opens.</p>
              <Button size="sm" variant="outline" onClick={handleJoinWaitingList}>Join waiting list</Button>
            </div>
          )}

          <Button className="w-full rounded-full" size="lg" disabled={!time || slotFull} onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Vehicle type</Label>
            <button type="button" className="w-full mt-1.5 flex items-center gap-3 p-4 rounded-xl border border-primary bg-primary/5">
              <Bike className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <div className="font-medium">EV Motorcycle</div>
                <div className="text-xs text-muted-foreground">Zero-emission electric bike</div>
              </div>
            </button>
          </div>

          <div>
            <Label>Meeting method</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button type="button" onClick={() => setMeetingMethod("walk_in")}
                className={`p-3 rounded-xl border text-left ${meetingMethod === "walk_in" ? "border-primary bg-primary/5" : ""}`}>
                <Building2 className="w-5 h-5 text-primary mb-1" />
                <div className="text-sm font-medium">Walk-in at Hub</div>
                <div className="text-[11px] text-muted-foreground">Free</div>
              </button>
              <button type="button" onClick={() => setMeetingMethod("hotel_pickup")}
                className={`p-3 rounded-xl border text-left ${meetingMethod === "hotel_pickup" ? "border-primary bg-primary/5" : ""}`}>
                <HomeIcon className="w-5 h-5 text-primary mb-1" />
                <div className="text-sm font-medium">Hotel Pickup</div>
                <div className="text-[11px] text-muted-foreground">RM{pickupRate.toFixed(2)}/km</div>
              </button>
            </div>
          </div>

          <div>
            <Label>Pickup hub</Label>
            <Select value={hub} onValueChange={setHub}>
              <SelectTrigger><SelectValue placeholder="Choose hub" /></SelectTrigger>
              <SelectContent>{hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Button className="w-full rounded-full" size="lg" disabled={!hub}
            onClick={() => setStep(meetingMethod === "hotel_pickup" ? 3 : 4)}>
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>Hotel / Location name</Label>
            <Input value={pickupName} onChange={(e) => setPickupName(e.target.value)} placeholder="e.g. Traders Hotel KL" />
          </div>
          <div>
            <Label>Full address</Label>
            <Textarea rows={2} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Latitude</Label>
              <Input value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} placeholder="3.1478" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} placeholder="101.6953" />
            </div>
          </div>
          {pickupLat && pickupLng && (
            <div className="rounded-xl bg-accent p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Distance</span><span>{pickupDistance} km</span></div>
              <div className="flex justify-between font-semibold"><span>Pickup fee</span><span>{money(pickupFee)}</span></div>
            </div>
          )}
          <Button className="w-full rounded-full" size="lg"
            disabled={!pickupName || !pickupAddress || !pickupLat || !pickupLng}
            onClick={() => setStep(4)}>
            Continue
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-4 space-y-2 text-sm">
            <div className="font-semibold text-base mb-2">{pkg.package_name}</div>
            <Row icon={<Clock className="w-4 h-4" />} label="Date & time" value={`${date} · ${time}`} />
            <Row icon={<Users className="w-4 h-4" />} label="Pax" value={String(pax)} />
            <Row icon={<Bike className="w-4 h-4" />} label="Vehicle" value="EV Motorcycle" />
            <Row icon={meetingMethod === "walk_in" ? <Building2 className="w-4 h-4" /> : <HomeIcon className="w-4 h-4" />}
              label="Meeting" value={meetingMethod === "walk_in" ? "Walk-in at hub" : `Pickup · ${pickupName}`} />
            {meetingMethod === "hotel_pickup" && (
              <Row icon={<MapPin className="w-4 h-4" />} label="Distance" value={`${pickupDistance} km`} />
            )}
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="rounded-xl border p-3 space-y-2">
            <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-primary" /> Promo code</Label>
            {promo ? (
              <div className="flex items-center justify-between bg-success/10 text-success rounded-lg px-3 py-2 text-sm font-medium">
                <span>{promo.code} · −{money(discount)}</span>
                <button type="button" onClick={() => { setPromo(null); setPromoInput(""); }}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Enter code" />
                <Button type="button" variant="outline" onClick={applyPromo} disabled={promoBusy || !promoInput.trim()}>Apply</Button>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs flex gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>Daily insurance included with every confirmed booking.</div>
          </div>

          <div className="rounded-xl bg-accent p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−{money(discount)}</span></div>}
            {pickupFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Pickup fee</span><span>{money(pickupFee)}</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t"><span>Total</span><span>{money(total)}</span></div>
          </div>

          <Button className="w-full rounded-full" size="lg" disabled={busy} onClick={createBooking}>Confirm & pay</Button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          {[
            { id: "card" as const, l: "Credit / Debit Card", I: CreditCard },
            { id: "chip_in" as const, l: "Chip In", I: Building2 },
            { id: "alipay" as const, l: "Alipay", I: Wallet },
            { id: "walk_in" as const, l: "Walk-in Payment Terminal", I: BanknoteIcon },
          ].map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border ${method === m.id ? "border-primary bg-primary/5" : ""}`}>
              <m.I className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left">{m.l}</span>
            </button>
          ))}
          <div className="rounded-xl bg-accent p-3 flex justify-between font-semibold">
            <span>Total</span><span>{money(total)}</span>
          </div>
          <Button className="w-full rounded-full" size="lg" disabled={busy} onClick={handlePay}>
            {method === "walk_in" ? "Confirm — pay at hub" : `Pay ${money(total)}`}
          </Button>
          {bookingId && (
            <Link to="/app/bookings/$id" params={{ id: bookingId }} className="block text-center text-xs text-muted-foreground">
              View booking
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground inline-flex items-center gap-2">{icon} {label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
