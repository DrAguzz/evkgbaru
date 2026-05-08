import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/book/$packageId")({
  component: BookPage,
});

const SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function BookPage() {
  const { packageId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<{ id: string; package_name: string; price: number; max_pax: number; start_hub_id: string | null } | null>(null);
  const [hubs, setHubs] = useState<{ id: string; name: string }[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [pax, setPax] = useState(1);
  const [hub, setHub] = useState<string>("");
  const [special, setSpecial] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/auth", search: { redirect: `/book/${packageId}` } });
  }, [user, packageId, navigate]);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("tour_packages").select("id,package_name,price,max_pax,start_hub_id").eq("id", packageId).single();
      setPkg(p);
      const { data: h } = await supabase.from("hubs").select("id,name").eq("status", "active");
      setHubs(h ?? []);
      if (p?.start_hub_id) setHub(p.start_hub_id);
    })();
  }, [packageId]);

  if (!pkg) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  const total = pkg.price * pax;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold">Book — {pkg.package_name}</h1>
          <Card className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div>
                  <Label>Time slot</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pax (max {pkg.max_pax})</Label>
                  <Input type="number" min={1} max={pkg.max_pax} value={pax} onChange={(e) => setPax(Math.max(1, Math.min(pkg.max_pax, Number(e.target.value) || 1)))} />
                </div>
                <div>
                  <Label>Pickup hub</Label>
                  <Select value={hub} onValueChange={setHub}>
                    <SelectTrigger><SelectValue placeholder="Choose hub" /></SelectTrigger>
                    <SelectContent>{hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Special request (optional)</Label>
                <Textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={3} placeholder="e.g. need child seat, wheelchair friendly route…" />
              </div>
            </CardContent>
          </Card>
        </div>
        <aside>
          <Card className="rounded-2xl border-0 shadow-card sticky top-20">
            <CardContent className="p-6 space-y-3">
              <div className="font-semibold">Price summary</div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{money(pkg.price)} × {pax} pax</span><span>{money(total)}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>Total</span><span>{money(total)}</span></div>
              <Button className="w-full rounded-full" size="lg" disabled={busy || !hub} onClick={async () => {
                if (!user) return;
                setBusy(true);
                const { data, error } = await supabase.from("bookings").insert({
                  tourist_id: user.id,
                  package_id: pkg.id,
                  pickup_hub_id: hub,
                  booking_date: date,
                  booking_time: time,
                  pax,
                  total_price: total,
                  special_request: special || null,
                }).select("id").single();
                setBusy(false);
                if (error) return toast.error(error.message);
                toast.success("Booking created — proceed to payment");
                navigate({ to: "/pay/$bookingId", params: { bookingId: data!.id } });
              }}>Confirm booking</Button>
              <Link to="/packages/$id" params={{ id: pkg.id }} className="block text-center text-xs text-muted-foreground hover:text-primary">← Back</Link>
            </CardContent>
          </Card>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
