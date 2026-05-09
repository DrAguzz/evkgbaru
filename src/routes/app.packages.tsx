import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDuration } from "@/lib/format";
import { packageToSlug } from "@/lib/package-slug";
import { Clock, Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/packages")({ component: AppPackages });

function AppPackages() {
  const [pkgs, setPkgs] = useState<{ id: string; package_name: string; price: number; image: string | null; duration_minutes: number; description: string | null }[]>([]);
  const navigate = useNavigate({ from: "/app/packages" });

  useEffect(() => {
    supabase.from("tour_packages").select("id,package_name,price,image,duration_minutes,description").eq("status", "active").eq("is_promo", false).then(({ data }) => setPkgs(data ?? []));
  }, []);

  const openPackage = (packageName: string) => {
    navigate({
      to: "/app/packages/$slug",
      params: { slug: packageToSlug(packageName) },
    });
  };

  return (
    <div className="pb-6">
      {/* Coloured header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary/80 text-primary-foreground rounded-b-[28px] px-5 pt-10 pb-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-secondary/40 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold leading-tight drop-shadow-sm">Packages</h1>
          <p className="text-sm opacity-90 mt-1">Choose your KL adventure.</p>
        </div>
      </div>

      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        {pkgs.map((p, i) => (
          <div
            key={p.id}
            onClick={() => openPackage(p.package_name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPackage(p.package_name);
              }
            }}
            role="button"
            tabIndex={0}
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPackage(p.package_name);
                }}
                className="grid place-items-center w-7 h-7 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
