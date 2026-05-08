import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Home, Compass, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/app" } });
  }, [loading, user, navigate]);

  const tabs = [
    { to: "/app", icon: Home, label: "Home", exact: true },
    { to: "/app/packages", icon: Compass, label: "Packages" },
    { to: "/app/bookings", icon: Ticket, label: "Bookings" },
    { to: "/app/profile", icon: User, label: "Profile" },
  ] as const;

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
