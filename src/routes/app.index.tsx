import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bike, Search, MapPin, Compass, Sparkles, Tag, Bell } from "lucide-react";
import { money, fmtDuration } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/")({ component: AppHome });

function AppHome() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [pkgs, setPkgs] = useState<{ id: string; package_name: string; price: number; image: string | null; duration_minutes: number }[]>([]);
  const [active, setActive] = useState<{ id: string; booking_no: string; booking_status: string; tour_packages: { package_name: string } | null } | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setName(prof?.name ?? "rider");
      }
      const { data } = await supabase.from("tour_packages").select("id,package_name,price,image,duration_minutes").eq("status", "active");
      setPkgs(data ?? []);
      if (user) {
        const { data: ab } = await supabase.from("bookings")
          .select("id, booking_no, booking_status, tour_packages(package_name)")
          .eq("tourist_id", user.id)
          .not("booking_status", "in", "(completed,cancelled,no_show)")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        setActive(ab as typeof active);
        const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "unread");
        setUnread(count ?? 0);
      }
    })();
  }, [user]);

  return (
    <div className="px-5 pt-8 pb-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Hello,</div>
          <div className="text-xl font-bold">{name || "rider"} 👋</div>
        </div>
        <button className="relative grid place-items-center w-10 h-10 rounded-full bg-accent">
          <Bell className="w-4 h-4 text-primary" />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 grid place-items-center w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground">{unread}</span>}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search tours, places…" className="pl-9 h-11 rounded-full bg-accent/60 border-0" />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[{ icon: Compass, l: "Heritage" }, { icon: Sparkles, l: "Food" }, { icon: MapPin, l: "City" }, { icon: Tag, l: "Promo" }].map((c) => (
          <div key={c.l} className="flex flex-col items-center gap-1">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-accent text-primary"><c.icon className="w-5 h-5" /></span>
            <span className="text-[10px] text-muted-foreground">{c.l}</span>
          </div>
        ))}
      </div>

      {/* Active booking */}
      {active && (
        <Link to="/bookings/$id" params={{ id: active.id }}>
          <div className="rounded-2xl bg-hero text-primary-foreground p-4 shadow-soft flex items-center gap-3">
            <Bike className="w-6 h-6" />
            <div className="flex-1">
              <div className="text-xs opacity-80">{active.booking_no}</div>
              <div className="font-semibold">{active.tour_packages?.package_name}</div>
            </div>
            <StatusBadge status={active.booking_status} className="bg-white/20 text-white border-white/30" />
          </div>
        </Link>
      )}

      {/* Promo banner */}
      <div className="rounded-2xl p-4 bg-secondary/20 border border-secondary/30">
        <div className="text-xs text-secondary-foreground/70">Promo</div>
        <div className="font-semibold">10% off your first ride 🎉</div>
        <div className="text-xs text-muted-foreground">Use code WELCOME10 at checkout.</div>
      </div>

      {/* Popular */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Popular packages</div>
          <Link to="/app/packages" className="text-xs text-primary">See all</Link>
        </div>
        <div className="space-y-3">
          {pkgs.slice(0, 3).map((p) => (
            <Link key={p.id} to="/app/packages/$id" params={{ id: p.id }} className="flex gap-3 p-2 rounded-2xl bg-card shadow-card">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                <img src={p.image ?? ""} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 py-1">
                <div className="font-semibold text-sm">{p.package_name}</div>
                <div className="text-xs text-muted-foreground">{fmtDuration(p.duration_minutes)}</div>
                <div className="text-primary font-bold text-sm mt-1">{money(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
