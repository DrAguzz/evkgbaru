import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SplashScreen } from "@/components/SplashScreen";
import { AppAuth } from "@/components/AppAuth";
import { Home, Compass, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  const wasAuthed = useRef(false);
  const [authView, setAuthView] = useState<null | "login" | "register">(null);

  useEffect(() => { if (user) wasAuthed.current = true; }, [user]);

  if (loading) {
    return <PhoneFrame><div className="grid place-items-center h-full">Loading…</div></PhoneFrame>;
  }
  if (!user) {
    return (
      <PhoneFrame>
        {authView ? (
          <AppAuth initialTab={authView} onBack={() => setAuthView(null)} />
        ) : (
          <SplashScreen
            interactive
            onLogin={() => setAuthView("login")}
            onRegister={() => setAuthView("register")}
          />
        )}
      </PhoneFrame>
    );
  }

  const tabs: { to: "/app" | "/app/packages" | "/app/bookings" | "/app/profile"; icon: typeof Home; label: string; exact?: boolean; color: string }[] = [
    { to: "/app", icon: Home, label: "Home", exact: true, color: "from-primary to-primary/70" },
    { to: "/app/packages", icon: Compass, label: "Packages", color: "from-secondary to-secondary/70" },
    { to: "/app/bookings", icon: Ticket, label: "Bookings", color: "from-success to-success/70" },
    { to: "/app/profile", icon: User, label: "Profile", color: "from-warning to-warning/70" },
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full md:h-[820px] pb-24">
        <div className="flex-1 overflow-y-auto"><Outlet /></div>
        <nav className="absolute bottom-3 left-3 right-3 z-30 rounded-3xl border border-white/40 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.6)] flex items-center justify-around py-2 px-2 overflow-hidden">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          {tabs.map((t) => {
            const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-2xl transition-all duration-300 group",
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className={cn("absolute inset-1 rounded-2xl bg-gradient-to-br shadow-lg -z-0", t.color)} />
                )}
                <t.icon className={cn("relative w-5 h-5 transition-transform", active ? "scale-110 drop-shadow" : "group-hover:scale-110")} />
                <span className="relative text-[10px] font-semibold tracking-wide">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </PhoneFrame>
  );
}
