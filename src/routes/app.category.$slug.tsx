import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, fmtDuration } from "@/lib/format";
import { packageToSlug } from "@/lib/package-slug";
import { ArrowLeft, Clock, Star, MapPin, Tag } from "lucide-react";

export const Route = createFileRoute("/app/category/$slug")({ component: CategoryPage });

interface Pkg {
  id: string; package_name: string; description: string | null; price: number;
  promo_price: number | null; discount_percentage: number | null; is_promo: boolean;
  duration_minutes: number; image: string | null; category: string;
}

const META: Record<string, { title: string; subtitle: string; cat: string }> = {
  heritage: { title: "Heritage Tours", subtitle: "Explore Kuala Lumpur's history, culture and iconic landmarks.", cat: "Heritage" },
  food:     { title: "Food Tours", subtitle: "Discover local food spots and authentic Kampung Baru flavours.", cat: "Food" },
  city:     { title: "City Tours", subtitle: "Enjoy Kuala Lumpur city views, skyline routes and urban attractions.", cat: "City" },
};

function CategoryPage() {
  const { slug } = Route.useParams();
  const meta = META[slug.toLowerCase()];
  const [pkgs, setPkgs] = useState<Pkg[] | null>(null);

  useEffect(() => {
    if (!meta) { setPkgs([]); return; }
    setPkgs(null);
    supabase.from("tour_packages")
      .select("id,package_name,description,price,promo_price,discount_percentage,is_promo,duration_minutes,image,category")
      .eq("status", "active").eq("category", meta.cat)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPkgs((data ?? []) as Pkg[]));
  }, [slug]);

  if (!meta) {
    return (
      <div className="px-5 pt-10 pb-24 text-center">
        <div className="text-sm text-muted-foreground">Unknown category.</div>
        <Link to="/app" className="mt-3 inline-block text-primary text-sm font-semibold">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground rounded-b-[28px] px-5 pt-10 pb-10">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <Link to="/app" className="relative inline-grid place-items-center w-9 h-9 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="relative text-2xl font-bold mt-3">{meta.title}</h1>
        <p className="relative text-xs opacity-90 mt-1 max-w-[90%]">{meta.subtitle}</p>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {pkgs === null && (
          <div className="space-y-3">
            {[0,1,2].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        )}
        {pkgs?.length === 0 && (
          <div className="rounded-2xl bg-card ring-1 ring-border/50 p-8 text-center">
            <div className="text-sm font-semibold">No packages yet</div>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new {meta.title.toLowerCase()}.</p>
          </div>
        )}
        {pkgs?.map((p) => <PkgCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

export function PkgCard({ p }: { p: Pkg }) {
  const showPromo = p.is_promo && p.promo_price != null;
  return (
    <div className="group rounded-3xl overflow-hidden bg-card shadow-card ring-1 ring-border/40 hover:shadow-elegant hover:-translate-y-0.5 hover:ring-primary/30 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {p.image && (
          <img
            src={p.image}
            alt={p.package_name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {/* Bottom fade so badges sit cleanly */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
        {/* Top-row badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-semibold text-foreground shadow-sm">
            <Star className="w-3 h-3 fill-warning text-warning" /> 4.9
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold shadow-sm">{p.category}</span>
        </div>
        {/* Promo pill */}
        {showPromo && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold uppercase tracking-wider shadow-md">
            <Tag className="w-3 h-3" /> -{p.discount_percentage ?? 0}% OFF
          </span>
        )}
      </div>

      {/* Content — has its own padding so it never overlaps the image */}
      <div className="p-4 space-y-2">
        <div className="font-semibold text-sm leading-snug line-clamp-1">{p.package_name}</div>
        <div className="text-xs text-muted-foreground line-clamp-2">{p.description ?? "Guided EV bike tour."}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(p.duration_minutes)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> KL hub</span>
        </div>
        <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
          <div>
            {showPromo ? (
              <div className="flex items-baseline gap-2">
                <span className="text-primary font-bold text-base">{money(p.promo_price!)}</span>
                <span className="text-xs text-muted-foreground line-through">{money(p.price)}</span>
              </div>
            ) : (
              <span className="text-primary font-bold text-base">{money(p.price)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/app/packages/$slug" params={{ slug: packageToSlug(p.package_name) }} className="px-3 py-1.5 text-xs font-semibold rounded-full ring-1 ring-border hover:bg-accent transition">Details</Link>
            <Link to="/app/book/$packageId" params={{ packageId: p.id }} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow-md transition">Book Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
