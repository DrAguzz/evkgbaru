import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bike, ListChecks, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rider")({ component: RiderShell });

function RiderShell() {
  const { user, loading, isRider, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from("riders").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setRiderId(data?.id ?? null); setChecking(false); });
  }, [user, isRider]);


  if (loading || checking) return <PhoneFrame><div className="grid place-items-center h-full">Loading…</div></PhoneFrame>;

  if (!user) {
    return (
      <PhoneFrame>
        <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center h-full">
          <div className="grid place-items-center w-20 h-20 rounded-3xl bg-hero text-primary-foreground mb-4"><Bike className="w-9 h-9" /></div>
          <h1 className="text-2xl font-bold">Rider App</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to access tours, history and your rider profile.</p>
          <Button className="mt-6 rounded-full w-full" onClick={() => navigate({ to: "/auth", search: { mode: "login", redirect: "/rider" } })}>
            Sign in
          </Button>
          <Button variant="ghost" className="mt-2" onClick={() => navigate({ to: "/auth", search: { mode: "register", redirect: "/rider" } })}>
            Create account
          </Button>
          <Button variant="ghost" className="mt-2" onClick={() => navigate({ to: "/" })}>Back to home</Button>
        </div>
      </PhoneFrame>
    );
  }

  if (user && !riderId) {
    return (
      <PhoneFrame>
        <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center h-full">
          <div className="grid place-items-center w-20 h-20 rounded-3xl bg-hero text-primary-foreground mb-4"><Bike className="w-9 h-9" /></div>
          <h1 className="text-2xl font-bold">Rider Mode</h1>
          <p className="text-sm text-muted-foreground mt-2">Claim a demo rider profile to receive assigned tours and update checkpoints.</p>
          <Button className="mt-6 rounded-full w-full" disabled={claiming} onClick={claim}>
            {claiming ? "Claiming…" : "Become a demo rider"}
          </Button>
          <Button variant="ghost" className="mt-2" onClick={() => navigate({ to: "/" })}>Back to home</Button>
        </div>
      </PhoneFrame>
    );
  }

  const tabs: { to: "/rider" | "/rider/history" | "/rider/profile"; icon: typeof Bike; label: string; exact?: boolean }[] = [
    { to: "/rider", icon: ListChecks, label: "Tours", exact: true },
    { to: "/rider/history", icon: Bell, label: "History" },
    { to: "/rider/profile", icon: User, label: "Profile" },
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full md:h-[820px] pb-20">
        <div className="flex-1 overflow-y-auto"><Outlet /></div>
        <nav className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t flex items-center justify-around py-2 px-2 z-30">
          {tabs.map((t) => {
            const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn("flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition", active ? "text-primary" : "text-muted-foreground")}>
                <t.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </PhoneFrame>
  );
}
