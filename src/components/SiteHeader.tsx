import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bike, User, LogOut, Smartphone, LayoutDashboard, Bike as BikeIcon } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, isRider, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-hero text-primary-foreground">
            <Bike className="w-5 h-5" />
          </span>
          <span>EV Kg Baru</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/packages" className="hover:text-primary transition-colors">Packages</Link>
          <Link to="/bookings" className="hover:text-primary transition-colors">My Bookings</Link>
          <Link to="/app" className="hover:text-primary transition-colors">Download App</Link>
          <Link to="/rider" className="hover:text-primary transition-colors">Rider App</Link>
        </nav>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>Login</Button>
              <Button size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "register" } })}>Sign up</Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  <User className="w-4 h-4 mr-2" /> {user.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate({ to: "/bookings" })}>
                  <BikeIcon className="w-4 h-4 mr-2" /> My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/app" })}>
                  <Smartphone className="w-4 h-4 mr-2" /> Mobile App view
                </DropdownMenuItem>
                {isRider && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/rider" })}>
                    <BikeIcon className="w-4 h-4 mr-2" /> Rider App
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
      <div className="relative container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-3 text-white">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30"><Bike className="w-4 h-4" /></span>
            EV Kg Baru
          </div>
          <p className="text-slate-400">Premium guided EV bike tours around Kuala Lumpur.</p>
        </div>
        <div>
          <div className="font-semibold mb-2 text-white">Support</div>
          <p className="text-slate-400">WhatsApp: +60 12-345 6789</p>
          <p className="text-slate-400">Email: hello@evkgbaru.my</p>
        </div>
        <div>
          <div className="font-semibold mb-2 text-white">Safety</div>
          <p className="text-slate-400">All riders are licensed and trained. Helmets and safety briefing included with every tour.</p>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-4 text-xs text-center text-slate-500">© {new Date().getFullYear()} EV Kg Baru. All rights reserved.</div>
    </footer>
  );
}
