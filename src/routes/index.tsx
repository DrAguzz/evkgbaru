import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bike, ArrowRight, UserPlus, Package, CreditCard, CheckCircle2, UserCheck,
  PlayCircle, Navigation, MapPin, Flag, Home, Route as RouteIcon, BikeIcon, Radar, Smartphone, PackageCheck,
  Shield, Sparkles, Cpu, Leaf, Users, ShieldCheck, LayoutDashboard,
} from "lucide-react";
import heroRider from "@/assets/hero-rider.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EV Kg Baru — Guided EV Bike Tours in Kuala Lumpur" },
      { name: "description", content: "Web-based open platform for tourists to book EV bike tour packages, make payments, and enjoy guided journeys with local riders." },
      { property: "og:title", content: "EV Kg Baru — Guided EV Bike Tours in Kuala Lumpur" },
      { property: "og:description", content: "Book a premium EV bike tour around KL with auto-assigned local rider and real-time tracking." },
    ],
  }),
  component: Landing,
});

const bookingJourney = [
  { n: 1, icon: UserPlus, title: "Register", desc: "Create an account as a tourist" },
  { n: 2, icon: Package, title: "Pick Package", desc: "Browse and choose tour package" },
  { n: 3, icon: CreditCard, title: "Confirm & Pay", desc: "Confirm details and make payment" },
  { n: 4, icon: CheckCircle2, title: "Success", desc: "Booking success & auto-assign rider" },
  { n: 5, icon: UserCheck, title: "Rider Assign", desc: "Tour rider assigned & notified" },
];

const tourJourney = [
  { n: 1, icon: PlayCircle, title: "Pickup / Ready", desc: "Tour rider pickup tourist at checkpoint or hotel" },
  { n: 2, icon: Navigation, title: "Move to Location", desc: "Rider leads the way, tourist follows behind on their own bike" },
  { n: 3, icon: MapPin, title: "Explore Location", desc: "Enjoy the destinations as per package itinerary" },
  { n: 4, icon: Flag, title: "Completed", desc: "Tour completed successfully" },
  { n: 5, icon: Home, title: "Return to Hub", desc: "Return to checkpoint or hub safely" },
];

const whyBetter = [
  { icon: RouteIcon, title: "Seamless Flow", desc: "Easy steps from register to ride" },
  { icon: BikeIcon, title: "Auto-Assign Rider", desc: "System auto-assigns best available rider" },
  { icon: Radar, title: "Real-Time Tracking", desc: "Live tracking for safety & peace of mind" },
  { icon: PackageCheck, title: "Complete Experience", desc: "From pickup to return, we handle all" },
  { icon: Smartphone, title: "Mobile First", desc: "Accessible anywhere, anytime, any device" },
];

const benefits = [
  { icon: Shield, title: "Safe & Secure", desc: "Verified riders & real-time monitoring" },
  { icon: Sparkles, title: "Better Experience", desc: "Local expertise & scenic routes" },
  { icon: Bike, title: "Flexible & Affordable", desc: "Various packages to suit every tourist" },
  { icon: Cpu, title: "Smart Technology", desc: "Auto assign, tracking, & digital journey" },
  { icon: Leaf, title: "Sustainable Travel", desc: "Promoting responsible & eco-friendly tourism" },
];

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden bg-hero min-h-[600px] md:min-h-[680px] flex items-center"
        style={{
          backgroundImage: `url(${heroRider})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Gradient overlay: dark left → clear right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.03) 100%)",
          }}
        />
        {/* Bottom fade for mobile readability */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="container relative mx-auto px-4 py-20 md:py-28 text-primary-foreground">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
              <Bike className="w-3.5 h-3.5" /> Tourist Open Web · Tour Booking Journey
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg whitespace-nowrap">
              Explore Kuala Lumpur<br />on a guided EV bike.
            </h1>
            <p className="mt-5 text-lg text-white/90 max-w-lg drop-shadow">
              Web-based open platform for tourists to book tour packages, make payments,
              and enjoy a guided journey with our local tour riders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/packages">
                <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold">
                  Book Your EV Bike Tour <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <div className="flex flex-nowrap items-center gap-3 w-full sm:w-auto">
                <Link to="/app" className="group flex items-center gap-2 rounded-2xl bg-black/80 hover:bg-black text-white px-5 py-2.5 ring-1 ring-white/15 backdrop-blur shadow-xl shadow-black/30 transition whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M16.365 1.43c0 1.14-.43 2.22-1.13 3.02-.76.86-2 .92-2.46.92-.05-1.06.46-2.16 1.12-2.94.74-.88 2-1 2.47-1zM20.5 17.13c-.45 1.05-.66 1.52-1.24 2.45-.81 1.3-1.95 2.92-3.36 2.93-1.25.01-1.57-.81-3.27-.8-1.7.01-2.05.81-3.3.8-1.41-.01-2.49-1.47-3.3-2.77C2.6 16.93 2.4 11.7 5.05 8.97c1.16-1.2 2.69-1.92 4.13-1.92 1.47 0 2.39.81 3.6.81 1.18 0 1.9-.81 3.6-.81 1.29 0 2.65.7 3.62 1.92-3.18 1.74-2.66 6.27.5 8.16z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] opacity-80">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </Link>
                <Link to="/app" className="group flex items-center gap-2 rounded-2xl bg-black/80 hover:bg-black text-white px-5 py-2.5 ring-1 ring-white/15 backdrop-blur shadow-xl shadow-black/30 transition whitespace-nowrap">
                  <svg viewBox="0 0 512 512" className="w-7 h-7 shrink-0" aria-hidden>
                    <path fill="#00d4ff" d="M48 60v392c0 6 2 11 6 14l203-203L54 46c-4 3-6 8-6 14z" />
                    <path fill="#00f076" d="M341 256l72-72L65 41c-4-2-9-2-12 0l290 215z" />
                    <path fill="#ffd600" d="M413 184l-72 72 71 71 73-39c10-6 16-15 16-25s-6-19-16-25l-72-54z" />
                    <path fill="#ff3a44" d="M53 471c4 2 9 2 13-1l347-143-72-71L53 471z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] opacity-80">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why this journey is better */}
      <section className="bg-hero text-primary-foreground py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Why this journey is better</h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-6">
            {whyBetter.map((w) => (
              <div key={w.title} className="group text-center px-2">
                <div className="relative mx-auto w-20 h-20 rounded-[26px] bg-gradient-to-br from-primary via-primary to-primary/70 shadow-2xl shadow-black/30 ring-1 ring-white/30 grid place-items-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-[26px] bg-gradient-to-b from-white/30 to-transparent opacity-60" />
                  <div className="absolute -inset-2 rounded-[32px] bg-white/0 group-hover:bg-white/10 blur-xl transition" />
                  <w.icon className="relative w-10 h-10 text-white drop-shadow-md" strokeWidth={2.2} />
                </div>
                <div className="mt-4 font-semibold text-sm uppercase tracking-wide">{w.title}</div>
                <p className="text-xs opacity-90 mt-1">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How it works for all users */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-accent/30 via-background to-accent/20">
        <div className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%),radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--secondary)_12%,transparent),transparent_60%)]" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">One platform, two experiences</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">A simple, guided journey for every tourist — and a clear, structured workflow for every rider.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Users, title: "For Tourist",
                accent: "from-primary/15 via-primary/5 to-transparent",
                ring: "ring-primary/20",
                badge: "bg-primary/10 text-primary",
                iconWrap: "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
                items: ["Register & choose package", "Make payment", "Get auto-assigned rider", "Enjoy the tour", "Real-time tracking", "Safe return to hub"],
                cta: { to: "/packages" as const, label: "Book a tour" },
                ctaClass: "bg-primary text-primary-foreground hover:bg-primary/90",
              },
              {
                icon: ShieldCheck, title: "For Tour Rider",
                accent: "from-secondary/15 via-secondary/5 to-transparent",
                ring: "ring-secondary/20",
                badge: "bg-secondary/10 text-secondary",
                iconWrap: "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-lg shadow-secondary/30",
                items: ["Receive auto assignment", "Pickup tourist", "Lead the tour route", "Ensure safety & experience", "Complete tour & return"],
                cta: { to: "/rider" as const, label: "Open Rider App" },
                ctaClass: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
              },
            ].map((card) => (
              <Card key={card.title} className={`group relative rounded-3xl border-0 shadow-card ring-1 ${card.ring} overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elegant`}>
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${card.accent} opacity-80`} />
                <CardContent className="p-7">
                  <div className="flex items-center justify-between">
                    <div className={`grid place-items-center w-14 h-14 rounded-2xl ${card.iconWrap}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full ${card.badge}`}>
                      {card.items.length} steps
                    </span>
                  </div>
                  <div className="mt-5 font-bold text-xl">{card.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">A clear flow from start to finish.</p>

                  <ol className="mt-6 space-y-3">
                    {card.items.map((it, i) => (
                      <li key={it} className="flex items-start gap-3 group/item">
                        <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-full text-xs font-bold ${card.badge} ring-1 ${card.ring} transition-transform group-hover/item:scale-110`}>
                          {i + 1}
                        </span>
                        <span className="text-sm pt-0.5 text-foreground/90 leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ol>

                  <Link
                    to={card.cta.to}
                    className={`mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${card.ctaClass} shadow-md hover:shadow-lg`}
                  >
                    {card.cta.label}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="rounded-3xl bg-hero text-primary-foreground border-0 shadow-soft">
          <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Explore More. Worry Less. We Ride With You.</h3>
              <p className="mt-1 opacity-90">Book in under 60 seconds.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/packages">
                <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold">
                  <CreditCard className="w-4 h-4 mr-2" /> Book now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}
