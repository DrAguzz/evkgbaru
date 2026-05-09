import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, ChevronLeft, Star, ShieldCheck, CheckCircle2, Navigation } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";

export const Route = createFileRoute("/app/packages/$id")({ component: AppPkgDetail });

interface Pkg {
  id: string;
  package_name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  min_pax: number;
  max_pax: number;
  image: string | null;
  category: string;
  start_hub_id: string | null;
}

function AppPkgDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [p, setP] = useState<Pkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [hubName, setHubName] = useState<string | null>(null);
  const [routes, setRoutes] = useState<{ sequence_no: number; locations: { name: string } | null }[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("tour_packages")
        .select("id,package_name,description,duration_minutes,price,min_pax,max_pax,image,category,start_hub_id")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      setP(data as Pkg | null);
      if (data?.start_hub_id) {
        const { data: h } = await supabase.from("hubs").select("name").eq("id", data.start_hub_id).maybeSingle();
        if (active) setHubName(h?.name ?? null);
      }
      const { data: r } = await supabase
        .from("package_routes")
        .select("sequence_no, locations(name)")
        .eq("package_id", id)
        .order("sequence_no");
      if (active) setRoutes((r ?? []) as unknown as typeof routes);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!p) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-lg font-semibold">Package not found</div>
        <p className="text-sm text-muted-foreground">This tour may no longer be available.</p>
        <Link to="/app/packages"><Button variant="outline">Back to Packages</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fade-in">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/11] bg-muted overflow-hidden">
          {p.image ? (
            <img src={p.image} alt={p.package_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
        </div>
        <button
          onClick={() => nav({ to: "/app/packages" })}
          className="absolute top-4 left-4 grid place-items-center w-10 h-10 rounded-full bg-background/90 backdrop-blur shadow-card"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute top-4 right-4 inline-flex items-center gap-1 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold">
          <Star className="w-3 h-3 fill-warning text-warning" /> 4.9
        </div>
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/25 backdrop-blur text-[11px] font-semibold mb-2">
            {p.category}
          </span>
          <h1 className="text-2xl font-extrabold drop-shadow leading-tight">{p.package_name}</h1>
        </div>
      </div>

      {/* Quick info */}
      <div className="px-5 -mt-5 relative z-10">
        <div className="bg-card rounded-2xl p-4 shadow-elegant grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-2">
            <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Duration</div>
            <div className="text-sm font-semibold">{fmtDuration(p.duration_minutes)}</div>
          </div>
          <div className="px-2">
            <Users className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Group</div>
            <div className="text-sm font-semibold">{p.min_pax}-{p.max_pax} pax</div>
          </div>
          <div className="px-2">
            <MapPin className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Stops</div>
            <div className="text-sm font-semibold">{routes.length}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <div className="px-5 mt-5">
          <h2 className="font-semibold mb-2">About this tour</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
        </div>
      )}

      {/* Start hub */}
      {hubName && (
        <div className="px-5 mt-5">
          <h2 className="font-semibold mb-2">Start hub</h2>
          <div className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-primary/10 text-primary">
              <Navigation className="w-4 h-4" />
            </span>
            <div className="text-sm font-medium">{hubName}</div>
          </div>
        </div>
      )}

      {/* Route */}
      {routes.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="font-semibold mb-2">Route</h2>
          <ol className="relative space-y-2 before:absolute before:left-[18px] before:top-3 before:bottom-3 before:w-px before:bg-border">
            {routes.map((r) => (
              <li key={r.sequence_no} className="relative flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
                <span className="relative z-10 grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {r.sequence_no}
                </span>
                <span className="text-sm">{r.locations?.name}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Included */}
      <div className="px-5 mt-5">
        <h2 className="font-semibold mb-2">What's included</h2>
        <ul className="space-y-1.5 text-sm">
          {["Electric bike rental", "Certified local guide", "Safety helmet & gear", "Bottled water"].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> {i}
            </li>
          ))}
        </ul>
      </div>

      {/* Safety */}
      <div className="px-5 mt-5">
        <div className="flex items-start gap-3 bg-accent/40 rounded-xl p-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Helmets are mandatory. Riders must be 16+ and able to ride a bicycle. Tour may be rescheduled in case of bad weather.
          </div>
        </div>
      </div>

      {/* Sticky bottom bar (inside scroll container, above tab bar) */}
      <div className="absolute left-0 right-0 bottom-20 px-3 z-20">
        <div className="bg-background/95 backdrop-blur border rounded-2xl shadow-elegant px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">From</div>
            <div className="font-bold text-primary text-lg leading-none">{money(p.price)}</div>
          </div>
          <Link to="/app/book/$packageId" params={{ packageId: p.id }} className="flex-1">
            <Button className="w-full rounded-full" size="lg">Book Now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
