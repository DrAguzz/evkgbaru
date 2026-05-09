import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { PkgCard } from "./app.category.$slug";

export const Route = createFileRoute("/app/promos")({ component: PromosPage });

interface Pkg {
  id: string; package_name: string; description: string | null; price: number;
  promo_price: number | null; discount_percentage: number | null; is_promo: boolean;
  duration_minutes: number; image: string | null; category: string;
}

function PromosPage() {
  const [pkgs, setPkgs] = useState<Pkg[] | null>(null);
  useEffect(() => {
    supabase.from("tour_packages")
      .select("id,package_name,description,price,promo_price,discount_percentage,is_promo,duration_minutes,image,category")
      .eq("status", "active").eq("is_promo", true)
      .order("discount_percentage", { ascending: false })
      .then(({ data }) => setPkgs((data ?? []) as Pkg[]));
  }, []);

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden bg-gradient-to-br from-warning via-warning to-warning/70 text-warning-foreground rounded-b-[28px] px-5 pt-10 pb-10">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/15 blur-2xl" />
        <Link to="/app" className="relative inline-grid place-items-center w-9 h-9 rounded-full bg-white/20 backdrop-blur ring-1 ring-white/30">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="relative text-2xl font-bold mt-3">Promo Deals</h1>
        <p className="relative text-xs opacity-90 mt-1">Save more on selected EV bike tour packages.</p>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {pkgs === null && [0,1,2].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
        {pkgs?.length === 0 && (
          <div className="rounded-2xl bg-card ring-1 ring-border/50 p-8 text-center">
            <div className="text-sm font-semibold">No promos right now</div>
            <p className="text-xs text-muted-foreground mt-1">New deals drop every week — check back soon.</p>
          </div>
        )}
        {pkgs?.map((p) => <PkgCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
