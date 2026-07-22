import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Bike,
  MapPin,
  Users,
  LogOut,
  ShieldCheck,
  Truck,
  ClipboardList,
  UserCog,
  UserCheck,
  CalendarClock,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminShell });

type AdminPath =
  | "/admin"
  | "/admin/checkin"
  | "/admin/trips"
  | "/admin/sos"
  | "/admin/hubs"
  | "/admin/vehicle-types"
  | "/admin/packages"
  | "/admin/riders"
  | "/admin/rider-applications"
  | "/admin/hub-admins"
  | "/admin/users";

interface NavItem {
  to: AdminPath;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  superOnly?: boolean;
}

function AdminShell() {
  const { user, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted px-4">
        <div className="max-w-md w-full bg-card rounded-3xl shadow-card p-8 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-hero text-primary-foreground mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your account has no admin role. Contact a Super Admin to grant access.
          </p>
          <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  const items: NavItem[] = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/admin/checkin", icon: UserCheck, label: "Check-in" },
    { to: "/admin/trips", icon: CalendarClock, label: "Trips" },
    { to: "/admin/sos", icon: AlertOctagon, label: "SOS" },
    { to: "/admin/hubs", icon: MapPin, label: "Hubs", superOnly: true },
    { to: "/admin/vehicle-types", icon: Truck, label: "Vehicle Types", superOnly: true },
    { to: "/admin/packages", icon: Package, label: "Packages" },
    { to: "/admin/rider-applications", icon: ClipboardList, label: "Rider Applications" },
    { to: "/admin/riders", icon: Bike, label: "Riders" },
    { to: "/admin/hub-admins", icon: UserCog, label: "Hub Admins", superOnly: true },
    { to: "/admin/users", icon: Users, label: "Customers", superOnly: true },
  ];

  const visible = items.filter((it) => !it.superOnly || isSuperAdmin);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 shrink-0 bg-slate-950 text-slate-100 border-r border-slate-800 flex-col hidden lg:flex">
        <div className="p-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Bike className="w-5 h-5" />
            </span>
            <span>EV Kg Baru Admin</span>
          </Link>
          <div className="text-xs text-slate-400 mt-2">
            {isSuperAdmin ? "Super Admin" : "Hub Admin"}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visible.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                )}
              >
                <it.icon className="w-4 h-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="px-2 mb-2 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-2 p-3 border-b bg-slate-950 text-slate-100 overflow-x-auto">
          {visible.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium",
                  active ? "bg-primary text-primary-foreground" : "bg-slate-800 text-slate-200",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
