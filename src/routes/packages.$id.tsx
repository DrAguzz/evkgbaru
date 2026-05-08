import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Shield, Calendar, ChevronRight } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/packages/$id")({
  component: PackageDetail,
});

interface Pkg { id: string; package_name: string; description: string | null; duration_minutes: number; price: number; min_pax: number; max_pax: number; image: string | null; start_hub_id: string | null; }
interface RouteRow { sequence_no: number; estimated_minutes: number; locations: { name: string; description: string | null; image: string | null } | null; }

function PackageDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("tour_packages").select("*").eq("id", id).single();
      setPkg(p as Pkg);
      const { data: r } = await supabase
        .from("package_routes")
        .select("sequence_no, estimated_minutes, locations(name, description, image)")
        .eq("package_id", id)
        .order("sequence_no");
      setRoutes((r ?? []) as unknown as RouteRow[]);
    })();
  }, [id]);

  if (!pkg) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted shadow-card">
            <img src={pkg.image ?? ""} alt={pkg.package_name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{pkg.package_name}</h1>
            <p className="mt-2 text-muted-foreground">{pkg.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent"><Clock className="w-3.5 h-3.5" /> {fmtDuration(pkg.duration_minutes)}</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent"><Users className="w-3.5 h-3.5" /> {pkg.min_pax}–{pkg.max_pax} pax</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent"><Shield className="w-3.5 h-3.5" /> Insured</span>
            </div>
          </div>

          {/* route map placeholder */}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-0">
              <div className="aspect-[16/7] bg-gradient-to-br from-accent to-secondary/30 grid place-items-center rounded-2xl relative overflow-hidden">
                <MapPin className="w-12 h-12 text-primary/40" />
                <span className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full bg-background/80">Map preview</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-3">Route checkpoints</h2>
            <ol className="space-y-3">
              {routes.map((r) => (
                <li key={r.sequence_no} className="flex gap-4 items-center bg-card rounded-2xl p-4 shadow-card">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">{r.sequence_no}</span>
                  <div className="flex-1">
                    <div className="font-medium">{r.locations?.name}</div>
                    <div className="text-xs text-muted-foreground">{r.locations?.description}</div>
                  </div>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> ~{r.estimated_minutes}m</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-sm">
            <div className="font-semibold mb-1">Safety notes</div>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Helmets and reflective vests provided.</li>
              <li>Brief safety instructions before departure.</li>
              <li>Riders must be 16+; under-18 with adult.</li>
            </ul>
          </div>
        </div>

        {/* Booking card */}
        <aside>
          <Card className="rounded-2xl border-0 shadow-card sticky top-20">
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Starting from</div>
                <div className="text-3xl font-bold text-primary">{money(pkg.price)}<span className="text-sm font-normal text-muted-foreground"> / pax</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-muted-foreground" /> Daily</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-muted-foreground" /> 9am–6pm slots</div>
              </div>
              <Button className="w-full rounded-full" size="lg" onClick={() => {
                if (!user) navigate({ to: "/auth", search: { redirect: `/book/${pkg.id}` } });
                else navigate({ to: "/book/$packageId", params: { packageId: pkg.id } });
              }}>
                Book now <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Link to="/packages" className="text-xs text-muted-foreground hover:text-primary block text-center">← Back to packages</Link>
            </CardContent>
          </Card>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
