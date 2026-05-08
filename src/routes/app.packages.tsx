import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDuration } from "@/lib/format";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/app/packages")({ component: AppPackages });

function AppPackages() {
  const [pkgs, setPkgs] = useState<{ id: string; package_name: string; price: number; image: string | null; duration_minutes: number; description: string | null }[]>([]);
  useEffect(() => {
    supabase.from("tour_packages").select("id,package_name,price,image,duration_minutes,description").eq("status", "active").then(({ data }) => setPkgs(data ?? []));
  }, []);
  return (
    <div className="px-5 pt-8 pb-6">
      <h1 className="text-2xl font-bold">Packages</h1>
      <p className="text-sm text-muted-foreground">Choose your KL adventure.</p>
      <div className="mt-4 space-y-3">
        {pkgs.map((p) => (
          <Link key={p.id} to="/app/packages/$id" params={{ id: p.id }} className="block rounded-2xl overflow-hidden bg-card shadow-card">
            <div className="aspect-[16/9] bg-muted"><img src={p.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
            <div className="p-3">
              <div className="flex items-center justify-between"><div className="font-semibold">{p.package_name}</div><div className="text-primary font-bold">{money(p.price)}</div></div>
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {fmtDuration(p.duration_minutes)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
