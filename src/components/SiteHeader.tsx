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
          <span>EVRide</span>
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
    <footer className="border-t mt-20">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-hero text-primary-foreground"><Bike className="w-4 h-4" /></span>
            EVRide
          </div>
          <p className="text-muted-foreground">Premium guided EV bike tours around Kuala Lumpur.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Support</div>
          <p className="text-muted-foreground">WhatsApp: +60 12-345 6789</p>
          <p className="text-muted-foreground">Email: hello@evride.my</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Safety</div>
          <p className="text-muted-foreground">All riders are licensed and trained. Helmets and safety briefing included with every tour.</p>
        </div>
      </div>
      <div className="border-t py-4 text-xs text-center text-muted-foreground">© {new Date().getFullYear()} EVRide. All rights reserved.</div>
    </footer>
  );
}
