import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Package, Bike, MapPin, Users, LogOut, ShieldCheck, Truck,
  ClipboardList, UserCog, UserCheck, CalendarClock, AlertOctagon, CreditCard,
  Ticket, Image as ImageIcon, Settings, ScrollText, FileBarChart, Bell,
  ChevronDown, Menu, X, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin")({ component: AdminShell });

type AdminPath =
  | "/admin" | "/admin/checkin" | "/admin/trips" | "/admin/sos" | "/admin/bookings"
  | "/admin/waiting-list" | "/admin/packages" | "/admin/hubs" | "/admin/vehicle-types"
  | "/admin/riders" | "/admin/rider-applications" | "/admin/users" | "/admin/hub-admins"
  | "/admin/payments" | "/admin/promos" | "/admin/reports" | "/admin/audit"
  | "/admin/settings" | "/admin/notifications-center";

interface NavItem { to: AdminPath; icon: typeof LayoutDashboard; label: string; exact?: boolean; superOnly?: boolean; }
interface NavGroup { label: string; items: NavItem[]; }

const GROUPS: NavGroup[] = [
  { label: "Operations", items: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/admin/checkin", icon: UserCheck, label: "Check-in" },
    { to: "/admin/trips", icon: CalendarClock, label: "Trips" },
    { to: "/admin/bookings", icon: ClipboardList, label: "Bookings" },
    { to: "/admin/waiting-list", icon: ListChecks, label: "Waiting list" },
    { to: "/admin/sos", icon: AlertOctagon, label: "SOS" },
  ] },
  { label: "Catalog", items: [
    { to: "/admin/packages", icon: Package, label: "Packages" },
    { to: "/admin/hubs", icon: MapPin, label: "Hubs", superOnly: true },
    { to: "/admin/vehicle-types", icon: Truck, label: "Vehicle types", superOnly: true },
  ] },
  { label: "People", items: [
    { to: "/admin/riders", icon: Bike, label: "Riders" },
    { to: "/admin/rider-applications", icon: ClipboardList, label: "Applications" },
    { to: "/admin/users", icon: Users, label: "Customers", superOnly: true },
    { to: "/admin/hub-admins", icon: UserCog, label: "Hub admins", superOnly: true },
  ] },
  { label: "Finance", items: [
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
    { to: "/admin/promos", icon: Ticket, label: "Promo codes", superOnly: true },
  ] },
  { label: "Insights", items: [
    { to: "/admin/reports", icon: FileBarChart, label: "Reports" },
    { to: "/admin/audit", icon: ScrollText, label: "Audit log", superOnly: true },
  ] },
  { label: "System", items: [
    { to: "/admin/settings", icon: Settings, label: "Settings", superOnly: true },
    { to: "/admin/notifications-center", icon: Bell, label: "Notifications", superOnly: true },
  ] },
];

function AdminShell() {
  const { user, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, navigate]);

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  const groups = useMemo(() =>
    GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.superOnly || isSuperAdmin) }))
          .filter((g) => g.items.length > 0),
    [isSuperAdmin]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted px-4">
        <div className="max-w-md w-full bg-card rounded-3xl shadow-card p-8 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-hero text-primary-foreground mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="text-sm text-muted-foreground mt-1">Your account has no admin role. Contact a Super Admin to grant access.</p>
          <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>Back to home</Button>
        </div>
      </div>
    );
  }

  async function handleSignOut() {
    await logAudit({ action: "logout", entity: "auth" });
    await signOut();
    navigate({ to: "/" });
  }

  const Nav = (
    <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
      {groups.map((g) => (
        <NavGroupBlock key={g.label} group={g} pathname={loc.pathname} />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 bg-slate-950 text-slate-100 border-r border-slate-800 flex-col hidden lg:flex">
        <div className="p-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Bike className="w-5 h-5" />
            </span>
            <span>EV Kg Baru</span>
          </Link>
          <div className="text-[11px] text-slate-400 mt-2 uppercase tracking-wider">
            {isSuperAdmin ? "Super Admin" : "Hub Admin"}
          </div>
        </div>
        {Nav}
        <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="px-2 mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-slate-950 text-slate-100 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="font-bold">EV Kg Baru</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            {Nav}
            <div className="p-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-200 hover:bg-slate-800" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-slate-950 text-slate-100 border-b border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2"><Menu className="w-5 h-5" /></button>
          <span className="font-semibold">EV Kg Baru</span>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}

function NavGroupBlock({ group, pathname }: { group: NavGroup; pathname: string }) {
  const hasActive = group.items.some((it) => (it.exact ? pathname === it.to : pathname.startsWith(it.to) && it.to !== "/admin"));
  const [open, setOpen] = useState<boolean>(hasActive || true);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300">
        <span>{group.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {group.items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                         : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                )}>
                <it.icon className="w-4 h-4" /> {it.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
