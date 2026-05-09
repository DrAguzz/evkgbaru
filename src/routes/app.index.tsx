import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bike, Search, MapPin, Compass, Sparkles, Tag, ArrowRight, Clock, Star } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/")({ component: AppHome });

interface Pkg { id: string; package_name: string; price: number; image: string | null; duration_minutes: number; description: string | null }
interface Active { id: string; booking_no: string; booking_status: string; tour_packages: { package_name: string; image: string | null } | null }

function AppHome() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [active, setActive] = useState<Active | null>(null);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single();
        setName((prof?.name ?? "explorer").split(" ")[0]);
        setAvatar(prof?.avatar_url ?? null);
      }
      const { data } = await supabase.from("tour_packages")
        .select("id,package_name,price,image,duration_minutes,description")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setPkgs(data ?? []);
      if (user) {
        const { data: ab } = await supabase.from("bookings")
          .select("id, booking_no, booking_status, tour_packages(package_name, image)")
          .eq("tourist_id", user.id)
          .not("booking_status", "in", "(completed,cancelled,no_show)")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        setActive(ab as unknown as Active);
        const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "unread");
        setUnread(count ?? 0);
      }
    })();
  }, [user]);

  const filtered = q
    ? pkgs.filter((p) => p.package_name.toLowerCase().includes(q.toLowerCase()))
    : pkgs;

  const cats: { icon: typeof Compass; l: string; c: string; to: "/app/category/$slug" | "/app/promos"; slug?: "heritage" | "food" | "city" }[] = [
    { icon: Compass,  l: "Heritage", c: "from-primary/15 to-primary/5 text-primary",     to: "/app/category/$slug", slug: "heritage" },
    { icon: Sparkles, l: "Food",     c: "from-secondary/15 to-secondary/5 text-secondary", to: "/app/category/$slug", slug: "food" },
    { icon: MapPin,   l: "City",     c: "from-success/15 to-success/5 text-success",     to: "/app/category/$slug", slug: "city" },
    { icon: Tag,      l: "Promo",    c: "from-warning/15 to-warning/5 text-warning",     to: "/app/promos" },
  ];

  return (
    <div className="pb-8">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground rounded-b-[28px] px-5 pt-10 pb-20">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-xs opacity-80">Hello,</div>
            <div className="text-2xl font-bold leading-tight">{name || "explorer"} 👋</div>
            <div className="text-xs opacity-80 mt-1">Where to today?</div>
          </div>
          <Link
            to="/app/profile"
            aria-label="Open profile"
            className="relative grid place-items-center w-12 h-12 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/40 hover:ring-white/70 hover:scale-105 transition shadow-lg shadow-black/20 overflow-hidden"
          >
            {avatar ? (
              <img src={avatar} alt={name || "Profile"} className="w-full h-full object-cover" />
            ) : (
              <span className="grid place-items-center w-full h-full bg-gradient-to-br from-white/30 to-white/10 text-sm font-bold uppercase tracking-wide">
                {(name || "U").slice(0, 1)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Floating search */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="rounded-2xl bg-card shadow-elegant ring-1 ring-border/50 p-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tours, places…"
              className="pl-9 h-10 rounded-xl border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
          <Link to="/app/packages" className="grid place-items-center h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-md">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Categories */}
        <div className="grid grid-cols-4 gap-3">
          {cats.map((c) => {
            const linkProps = c.slug
              ? { to: "/app/category/$slug" as const, params: { slug: c.slug } }
              : { to: "/app/promos" as const };
            return (
              <Link key={c.l} {...linkProps} className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
                <span className={`grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${c.c} ring-1 ring-border/40 shadow-sm group-hover:scale-105 group-active:scale-100 transition-transform`}>
                  <c.icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-foreground/80">{c.l}</span>
              </Link>
            );
          })}
        </div>

        {/* Active booking */}
        {active && (
          <Link to="/app/bookings/$id" params={{ id: active.id }} className="block">
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-secondary to-secondary/70 text-secondary-foreground shadow-elegant">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur ring-1 ring-white/30">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Active tour · {active.booking_no}</div>
                  <div className="font-semibold truncate">{active.tour_packages?.package_name}</div>
                </div>
                <StatusBadge status={active.booking_status} className="bg-white/25 text-white border-white/30" />
              </div>
            </div>
          </Link>
        )}

        {/* Promo banner */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-warning/15 to-warning/5 ring-1 ring-warning/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-warning">Promo</div>
              <div className="font-semibold mt-0.5">10% off your first ride 🎉</div>
              <div className="text-xs text-muted-foreground mt-0.5">Use code <span className="font-mono font-semibold text-foreground">WELCOME10</span> at checkout.</div>
            </div>
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-warning/20 text-warning shrink-0">
              <Tag className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* All packages — list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-base">For you</div>
            <Link to="/app/packages" className="text-xs font-semibold text-primary">See all</Link>
          </div>
          <div className="space-y-3">
            {filtered.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/app/packages/$id"
                params={{ id: p.id }}
                className="flex gap-3 p-2.5 rounded-2xl bg-card shadow-card ring-1 ring-border/40 hover:ring-primary/30 transition"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  {p.image && <img src={p.image} alt={p.package_name} className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="flex-1 py-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.package_name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(p.duration_minutes)}</span>
                    <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> 4.9</span>
                  </div>
                  <div className="text-primary font-bold text-sm mt-1">{money(p.price)}</div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No tours match "{q}"</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
