import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, ChevronLeft } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";

export const Route = createFileRoute("/app/packages/$id")({ component: AppPkgDetail });

function AppPkgDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [p, setP] = useState<{ id: string; package_name: string; description: string | null; duration_minutes: number; price: number; min_pax: number; max_pax: number; image: string | null } | null>(null);
  const [routes, setRoutes] = useState<{ sequence_no: number; locations: { name: string } | null }[]>([]);
  useEffect(() => {
    supabase.from("tour_packages").select("*").eq("id", id).single().then(({ data }) => setP(data));
    supabase.from("package_routes").select("sequence_no, locations(name)").eq("package_id", id).order("sequence_no").then(({ data }) => setRoutes((data ?? []) as unknown as typeof routes));
  }, [id]);
  if (!p) return <div className="p-8">Loading…</div>;
  return (
    <div className="pb-24">
      <div className="relative">
        <div className="aspect-[16/10] bg-muted"><img src={p.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
        <button onClick={() => nav({ to: "/app/packages" })} className="absolute top-4 left-4 grid place-items-center w-10 h-10 rounded-full bg-background/90 backdrop-blur"><ChevronLeft className="w-5 h-5" /></button>
      </div>
      <div className="px-5 -mt-6 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h1 className="text-xl font-bold">{p.package_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent"><Clock className="w-3 h-3" />{fmtDuration(p.duration_minutes)}</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent"><Users className="w-3 h-3" />{p.min_pax}-{p.max_pax} pax</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent"><MapPin className="w-3 h-3" />{routes.length} stops</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Route</div>
          <ol className="space-y-2">
            {routes.map((r) => (
              <li key={r.sequence_no} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">{r.sequence_no}</span>
                <span className="text-sm">{r.locations?.name}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="fixed md:absolute bottom-16 left-0 right-0 px-5 py-3 bg-background/95 border-t backdrop-blur md:rounded-b-[2.5rem]">
        <div className="flex items-center justify-between gap-4">
          <div><div className="text-[10px] text-muted-foreground">From</div><div className="font-bold text-primary">{money(p.price)}</div></div>
          <Link to="/app/book/$packageId" params={{ packageId: p.id }} className="flex-1">
            <Button className="w-full rounded-full" size="lg">Book now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
