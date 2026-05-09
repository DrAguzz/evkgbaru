import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, CreditCard, Wallet, Building2, BanknoteIcon, Tag, X } from "lucide-react";
import { money } from "@/lib/format";
import { processMockPayment } from "@/lib/booking";
import { toast } from "sonner";

interface AppliedPromo { id: string; code: string; discount_type: string; discount_value: number; min_amount: number; }

export const Route = createFileRoute("/app/book/$packageId")({ component: AppBook });
const SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function AppBook() {
  const { packageId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [pkg, setPkg] = useState<{ id: string; package_name: string; price: number; max_pax: number; start_hub_id: string | null } | null>(null);
  const [hubs, setHubs] = useState<{ id: string; name: string }[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [pax, setPax] = useState(1);
  const [hub, setHub] = useState("");
  const [special, setSpecial] = useState("");
  const [method, setMethod] = useState("card");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  useEffect(() => {
    supabase.from("tour_packages").select("id,package_name,price,max_pax,start_hub_id").eq("id", packageId).single().then(({ data }) => { setPkg(data); if (data?.start_hub_id) setHub(data.start_hub_id); });
    supabase.from("hubs").select("id,name").eq("status", "active").then(({ data }) => setHubs(data ?? []));
  }, [packageId]);

  if (!pkg) return <div className="p-8">Loading…</div>;
  const subtotal = pkg.price * pax;
  const discount = !promo ? 0 : promo.discount_type === "percentage"
    ? Math.round(subtotal * (promo.discount_value / 100) * 100) / 100
    : Math.min(promo.discount_value, subtotal);
  const total = Math.max(0, subtotal - discount);

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoBusy(true);
    const { data, error } = await supabase.from("promo_codes").select("id,code,discount_type,discount_value,min_amount,max_uses,used_count,valid_from,valid_until,status").eq("code", code).maybeSingle();
    setPromoBusy(false);
    if (error || !data) return toast.error("Invalid promo code");
    const now = new Date();
    if (data.status !== "active") return toast.error("This code is not active");
    if (data.valid_from && new Date(data.valid_from) > now) return toast.error("This code is not yet valid");
    if (data.valid_until && new Date(data.valid_until) < now) return toast.error("This code has expired");
    if (data.max_uses != null && data.used_count >= data.max_uses) return toast.error("This code has reached its usage limit");
    if (subtotal < Number(data.min_amount)) return toast.error(`Minimum spend ${money(Number(data.min_amount))}`);
    setPromo({ id: data.id, code: data.code, discount_type: data.discount_type, discount_value: Number(data.discount_value), min_amount: Number(data.min_amount) });
    toast.success(`Promo "${data.code}" applied`);
  }

  return (
    <div className="px-5 pt-8 pb-24">
      <button onClick={() => nav({ to: "/app/packages/$id", params: { id: pkg.id } })} className="grid place-items-center w-10 h-10 rounded-full bg-accent mb-4"><ChevronLeft className="w-5 h-5" /></button>
      <h1 className="text-xl font-bold">{step === 1 ? "Booking details" : "Payment"}</h1>
      <div className="text-sm text-muted-foreground mb-4">{pkg.package_name}</div>

      {step === 1 ? (
        <div className="space-y-3">
          <div><Label>Date</Label><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div>
            <Label>Time slot</Label>
            <Select value={time} onValueChange={setTime}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Pax</Label><Input type="number" min={1} max={pkg.max_pax} value={pax} onChange={(e) => setPax(Math.max(1, Math.min(pkg.max_pax, +e.target.value || 1)))} /></div>
            <div>
              <Label>Pickup hub</Label>
              <Select value={hub} onValueChange={setHub}><SelectTrigger><SelectValue placeholder="Hub" /></SelectTrigger><SelectContent>{hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div><Label>Special request</Label><Textarea rows={2} value={special} onChange={(e) => setSpecial(e.target.value)} /></div>
          <div className="rounded-xl bg-accent p-3 flex justify-between font-semibold"><span>Total</span><span>{money(total)}</span></div>
          <Button className="w-full rounded-full" size="lg" disabled={busy || !hub} onClick={async () => {
            if (!user) return;
            setBusy(true);
            const { data, error } = await supabase.from("bookings").insert({
              tourist_id: user.id, package_id: pkg.id, pickup_hub_id: hub, booking_date: date,
              booking_time: time, pax, total_price: total, special_request: special || null,
            }).select("id").single();
            setBusy(false);
            if (error) return toast.error(error.message);
            setBookingId(data!.id); setStep(2);
          }}>Confirm details</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { id: "card", l: "Credit / Debit Card", I: CreditCard },
            { id: "fpx", l: "Online Banking", I: Building2 },
            { id: "ewallet", l: "E-Wallet", I: Wallet },
            { id: "manual", l: "Manual", I: BanknoteIcon },
          ].map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border ${method === m.id ? "border-primary bg-primary/5" : ""}`}>
              <m.I className="w-5 h-5 text-primary" /><span className="flex-1 text-left">{m.l}</span>
            </button>
          ))}
          <div className="rounded-xl bg-accent p-3 flex justify-between font-semibold"><span>Total</span><span>{money(total)}</span></div>
          <Button className="w-full rounded-full" size="lg" disabled={busy} onClick={async () => {
            if (!bookingId) return;
            setBusy(true);
            try { await processMockPayment(bookingId, method, total); toast.success("Paid! Rider being assigned"); nav({ to: "/app/bookings" }); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Payment failed"); }
            finally { setBusy(false); }
          }}>Pay {money(total)}</Button>
          {bookingId && <Link to="/app/bookings/$id" params={{ id: bookingId }} className="block text-center text-xs text-muted-foreground">View booking</Link>}
        </div>
      )}
    </div>
  );
}
