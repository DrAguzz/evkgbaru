import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDuration } from "@/lib/format";
import { Clock, Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/packages")({ component: AppPackages });

function AppPackages() {
  const [pkgs, setPkgs] = useState<{ id: string; package_name: string; price: number; image: string | null; duration_minutes: number; description: string | null }[]>([]);
  useEffect(() => {
    supabase.from("tour_packages").select("id,package_name,price,image,duration_minutes,description").eq("status", "active").eq("is_promo", false).then(({ data }) => setPkgs(data ?? []));
  }, []);
  return (
    <div className="px-5 pt-8 pb-6">
      <h1 className="text-2xl font-bold">Packages</h1>
      <p className="text-sm text-muted-foreground">Choose your KL adventure.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {pkgs.map((p, i) => (
          <Link
            key={p.id}
            to="/app/packages/$id"
            params={{ id: p.id }}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group relative block rounded-2xl overflow-hidden bg-card ring-1 ring-border/40 shadow-card hover:shadow-elegant hover:ring-primary/30 hover:-translate-y-0.5 transition-all duration-300 animate-fade-in active:scale-[0.98]"
          >
            <div className="relative aspect-[4/5] bg-muted overflow-hidden">
              {p.image && (
                <img
                  src={p.image}
                  alt={p.package_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-foreground">
                <Star className="w-2.5 h-2.5 fill-warning text-warning" /> 4.9
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <div className="font-semibold text-[13px] leading-tight line-clamp-2">{p.package_name}</div>
                <div className="flex items-center gap-1 text-[10px] opacity-90 mt-1">
                  <Clock className="w-2.5 h-2.5" /> {fmtDuration(p.duration_minutes)}
                </div>
              </div>
            </div>
            <div className="p-2.5 flex items-center justify-between">
              <div className="font-bold text-primary text-sm">{money(p.price)}</div>
              <span className="grid place-items-center w-7 h-7 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
