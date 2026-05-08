import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Package, Bike, MapPin, Users, LogOut, ShieldCheck, Route as RouteIcon, BarChart3, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminShell });

function AdminShell() {
  const { user, isAdmin, loading, signOut, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [loading, user, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted px-4">
        <div className="max-w-md w-full bg-card rounded-3xl shadow-card p-8 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-hero text-primary-foreground mx-auto mb-3"><ShieldCheck className="w-7 h-7" /></div>
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="text-sm text-muted-foreground mt-1">Claim the demo admin role to access the dashboard.</p>
          <Button className="mt-5 rounded-full w-full" disabled={claiming} onClick={async () => {
            setClaiming(true);
            const { error } = await supabase.rpc("claim_admin_role");
            setClaiming(false);
            if (error) return toast.error(error.message);
            toast.success("Admin role granted.");
            await refreshRoles();
          }}>{claiming ? "Granting…" : "Become demo admin"}</Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate({ to: "/" })}>Back to home</Button>
        </div>
      </div>
    );
  }

  const items: { to: "/admin" | "/admin/bookings" | "/admin/packages" | "/admin/routes" | "/admin/hubs" | "/admin/locations" | "/admin/riders" | "/admin/users" | "/admin/reports"; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/admin/bookings", icon: Calendar, label: "Bookings" },
    { to: "/admin/packages", icon: Package, label: "Packages" },
    { to: "/admin/routes", icon: RouteIcon, label: "Routes" },
    { to: "/admin/hubs", icon: MapPin, label: "Hubs" },
    { to: "/admin/locations", icon: Pin, label: "Locations" },
    { to: "/admin/riders", icon: Bike, label: "Riders" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/reports", icon: BarChart3, label: "Reports" },
  ];

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 shrink-0 bg-card border-r flex flex-col hidden lg:flex">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-hero text-primary-foreground"><Bike className="w-5 h-5" /></span>
            <span>EVRide Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition", active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}>
                <it.icon className="w-4 h-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t text-xs text-muted-foreground">
          <div className="px-2 mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-2 p-3 border-b bg-card overflow-x-auto">
          {items.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium", active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {it.label}
              </Link>
            );
          })}
        </div>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}
