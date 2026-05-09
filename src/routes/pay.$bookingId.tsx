import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Building2, BanknoteIcon, CheckCircle2, ShieldCheck } from "lucide-react";
import { money } from "@/lib/format";
import { processMockPayment } from "@/lib/booking";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/pay/$bookingId")({
  component: PayPage,
});

const METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "fpx", label: "Online Banking (FPX)", icon: Building2 },
  { id: "ewallet", label: "E-Wallet", icon: Wallet },
  { id: "manual", label: "Manual Payment", icon: BanknoteIcon },
];

function PayPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<{ id: string; booking_no: string; total_price: number; pax: number; payment_status: string; tour_packages: { package_name: string } | null } | null>(null);
  const [method, setMethod] = useState("card");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_no, total_price, pax, payment_status, tour_packages(package_name)")
        .eq("id", bookingId)
        .single();
      setBooking(data as typeof booking);
    })();
  }, [bookingId, user]);

  if (authLoading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 grid place-items-center px-4 py-12">
          <Card className="w-full max-w-md rounded-2xl border-0 shadow-card text-center">
            <CardContent className="p-8 space-y-3">
              <div className="text-xl font-bold">Login required</div>
              <p className="text-sm text-muted-foreground">Please login to continue your payment.</p>
              <Button className="rounded-full" onClick={() => navigate({ to: "/login", search: { redirect: `/pay/${bookingId}` } })}>Go to login</Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!booking) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (booking.payment_status === "paid") {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 grid place-items-center px-4 py-12">
          <Card className="w-full max-w-md rounded-2xl border-0 shadow-card text-center">
            <CardContent className="p-8 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
              <div className="text-xl font-bold">Already paid</div>
              <Button className="rounded-full" onClick={() => navigate({ to: "/bookings/$id", params: { id: booking.id } })}>View booking</Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">Payment</h1>
          <Card className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="font-semibold">Choose payment method</div>
              <RadioGroup value={method} onValueChange={setMethod} className="space-y-2">
                {METHODS.map((m) => (
                  <Label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${method === m.id ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value={m.id} />
                    <m.icon className="w-5 h-5 text-primary" />
                    <span className="flex-1">{m.label}</span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 text-success" /> Mock gateway — no real charge.</div>
            </CardContent>
          </Card>
        </div>
        <aside>
          <Card className="rounded-2xl border-0 shadow-card sticky top-20">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm text-muted-foreground">Booking</div>
              <div className="font-semibold">{booking.tour_packages?.package_name}</div>
              <div className="text-xs text-muted-foreground">Ref: {booking.booking_no}</div>
              <div className="border-t pt-3 flex justify-between font-bold"><span>Total</span><span>{money(booking.total_price)}</span></div>
              <Button className="w-full rounded-full" size="lg" disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  await processMockPayment(booking.id, method, booking.total_price);
                  toast.success("Payment successful — rider being assigned");
                  navigate({ to: "/bookings/$id", params: { id: booking.id } });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Payment failed";
                  toast.error(msg);
                } finally { setBusy(false); }
              }}>Pay now</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
