import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Search } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";

export const Route = createFileRoute("/packages/")({
  head: () => ({ meta: [{ title: "Tour Packages — EV Kg Baru" }, { name: "description", content: "Browse all EV bike tour packages around Kuala Lumpur." }] }),
  component: PackagesList,
});

interface Pkg {
  id: string; package_name: string; description: string | null;
  duration_minutes: number; price: number; max_pax: number;
  image: string | null; start_hub_id: string | null;
}

function PackagesList() {
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [routesByPkg, setRoutesByPkg] = useState<Record<string, number>>({});
  const [hubs, setHubs] = useState<{ id: string; name: string }[]>([]);
  const [q, setQ] = useState("");
  const [hub, setHub] = useState("all");
  const [sort, setSort] = useState("price_asc");

  useEffect(() => {
    (async () => {
      const { data: pk } = await supabase.from("tour_packages").select("*").eq("status", "active");
      setPkgs((pk ?? []) as Pkg[]);
      const { data: rt } = await supabase.from("package_routes").select("package_id");
      const counts: Record<string, number> = {};
      (rt ?? []).forEach((r) => { counts[r.package_id] = (counts[r.package_id] ?? 0) + 1; });
      setRoutesByPkg(counts);
      const { data: hb } = await supabase.from("hubs").select("id,name");
      setHubs(hb ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = pkgs.filter((p) => p.package_name.toLowerCase().includes(q.toLowerCase()));
    if (hub !== "all") arr = arr.filter((p) => p.start_hub_id === hub);
    arr = [...arr].sort((a, b) =>
      sort === "price_asc" ? a.price - b.price :
      sort === "price_desc" ? b.price - a.price :
      a.duration_minutes - b.duration_minutes
    );
    return arr;
  }, [pkgs, q, hub, sort]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tour Packages</h1>
            <p className="text-muted-foreground">Pick your KL adventure.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search packages…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-full sm:w-56" />
            </div>
            <Select value={hub} onValueChange={setHub}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Start hub" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hubs</SelectItem>
                {hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="price_asc">Price (low → high)</SelectItem>
                <SelectItem value="price_desc">Price (high → low)</SelectItem>
                <SelectItem value="duration">Shortest tours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="rounded-2xl border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No packages match your filters.</CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden rounded-2xl border-0 shadow-card group">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img src={p.image ?? ""} alt={p.package_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-lg">{p.package_name}</div>
                    <div className="text-primary font-bold whitespace-nowrap">{money(p.price)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDuration(p.duration_minutes)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {routesByPkg[p.id] ?? 0} stops</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> max {p.max_pax}</span>
                  </div>
                  <Link to="/packages/$id" params={{ id: p.id }}>
                    <Button className="mt-4 w-full rounded-full">View details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
