import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertOctagon, MapPin, Phone, Bike, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sos")({ component: AdminSOS });

interface Alert {
  id: string; booking_id: string; tourist_id: string; rider_id: string | null;
  latitude: number | null; longitude: number | null; message: string | null;
  emergency_contact: string | null; status: string; created_at: string;
  acknowledged_at: string | null; resolved_at: string | null;
  bookings: {
    booking_no: string;
    profiles: { name: string; phone: string | null; email: string } | null;
    riders: { name: string; phone: string | null; rider_code: string | null } | null;
    tour_packages: { package_name: string } | null;
    hubs: { name: string } | null;
  } | null;
}

function AdminSOS() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Alert[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("sos_alerts")
      .select("*, bookings!inner(booking_no, tour_packages(package_name), hubs:pickup_hub_id(name), profiles!bookings_tourist_profile_fkey(name, phone, email), riders(name, phone, rider_code))")
      .order("created_at", { ascending: false }).limit(50);
    setRows((data ?? []) as unknown as Alert[]);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`admin-sos-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function ack(a: Alert) {
    await supabase.from("sos_alerts").update({ status: "acknowledged", acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() }).eq("id", a.id);
    toast.success("Acknowledged"); load();
  }
  async function resolve(a: Alert) {
    await supabase.from("sos_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", a.id);
    toast.success("Marked resolved"); load();
  }

  const open = rows.filter((r) => r.status === "open");
  const others = rows.filter((r) => r.status !== "open");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-destructive/10 text-destructive"><AlertOctagon className="w-5 h-5" /></span>
        <div>
          <h1 className="text-2xl font-bold">SOS emergencies</h1>
          <p className="text-sm text-muted-foreground">Live emergency alerts from customers during active trips.</p>
        </div>
      </div>

      {open.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase text-destructive mb-2">Active · {open.length}</div>
          <div className="grid gap-3">
            {open.map((a) => <SOSCard key={a.id} a={a} onAck={() => ack(a)} onResolve={() => resolve(a)} accent />)}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-bold uppercase text-muted-foreground mb-2">History</div>
        <div className="grid gap-3">
          {others.map((a) => <SOSCard key={a.id} a={a} onAck={() => ack(a)} onResolve={() => resolve(a)} />)}
          {others.length === 0 && open.length === 0 && (
            <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-10 text-center text-muted-foreground">No SOS alerts.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SOSCard({ a, onAck, onResolve, accent }: { a: Alert; onAck: () => void; onResolve: () => void; accent?: boolean }) {
  const mapsUrl = a.latitude && a.longitude ? `https://maps.google.com/?q=${a.latitude},${a.longitude}` : null;
  return (
    <Card className={`rounded-2xl shadow-card ${accent ? "border-destructive/40 ring-1 ring-destructive/30 animate-pulse" : "border-0"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className={`w-5 h-5 ${accent ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <div className="font-semibold">{a.bookings?.booking_no} · {a.bookings?.tour_packages?.package_name}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          </div>
          <StatusBadge status={a.status} />
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="w-3 h-3" /> Customer</div>
            <div className="font-medium">{a.bookings?.profiles?.name}</div>
            <div className="text-xs">{a.bookings?.profiles?.phone}</div>
            <div className="text-xs text-muted-foreground">{a.bookings?.profiles?.email}</div>
            {a.emergency_contact && <div className="text-xs mt-1"><span className="text-muted-foreground">ICE:</span> {a.emergency_contact}</div>}
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Bike className="w-3 h-3" /> Rider</div>
            <div className="font-medium">{a.bookings?.riders?.name ?? "—"}</div>
            <div className="text-xs font-mono text-muted-foreground">{a.bookings?.riders?.rider_code}</div>
            <div className="text-xs">{a.bookings?.riders?.phone}</div>
            <div className="text-xs text-muted-foreground">Hub: {a.bookings?.hubs?.name}</div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Live location</div>
            {a.latitude && a.longitude ? (
              <>
                <div className="font-mono text-xs">{a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}</div>
                {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open in Google Maps</a>}
              </>
            ) : <div className="text-xs text-muted-foreground">No coordinates</div>}
          </div>
        </div>

        {a.message && <div className="mt-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm">"{a.message}"</div>}

        <div className="mt-4 flex gap-2 justify-end">
          {a.bookings?.profiles?.phone && (
            <Button size="sm" variant="outline" onClick={() => window.open(`tel:${a.bookings?.profiles?.phone}`)}><Phone className="w-3.5 h-3.5 mr-1" /> Call customer</Button>
          )}
          <Link to="/admin/bookings/$id" params={{ id: a.booking_id }}><Button size="sm" variant="outline">Open booking</Button></Link>
          {a.status === "open" && <Button size="sm" variant="secondary" onClick={onAck}>Acknowledge</Button>}
          {a.status !== "resolved" && <Button size="sm" onClick={onResolve}>Mark resolved</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
