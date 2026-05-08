import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bike, ArrowRight, UserPlus, Package, CreditCard, CheckCircle2, UserCheck,
  PlayCircle, Navigation, MapPin, Flag, Home, Workflow, Zap, Activity, Globe,
  Shield, Sparkles, Cpu, Leaf, Users, ShieldCheck, LayoutDashboard,
} from "lucide-react";
import heroRider from "@/assets/hero-rider.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EVRide — Guided EV Bike Tours in Kuala Lumpur" },
      { name: "description", content: "Web-based open platform for tourists to book EV bike tour packages, make payments, and enjoy guided journeys with local riders." },
      { property: "og:title", content: "EVRide — Guided EV Bike Tours in Kuala Lumpur" },
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
  { icon: Workflow, title: "Seamless Flow", desc: "Easy steps from register to ride" },
  { icon: Zap, title: "Auto-Assign Rider", desc: "System auto-assigns best available rider" },
  { icon: Activity, title: "Real-Time Tracking", desc: "Live tracking for safety & peace of mind" },
  { icon: CheckCircle2, title: "Complete Experience", desc: "From pickup to return, we handle all" },
  { icon: Globe, title: "Web Based", desc: "Accessible anywhere, anytime, any device" },
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
      <section className="relative overflow-hidden bg-hero">
        <div className="container relative mx-auto px-4 py-16 md:py-24 text-primary-foreground">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <img
                  src={heroRider}
                  alt="EV bike rider in Kuala Lumpur with Petronas Towers in background"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
                <Bike className="w-3.5 h-3.5" /> Tourist Open Web · Tour Booking Journey
              </span>
              <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
                Explore Kuala Lumpur<br />on a guided EV bike.
              </h1>
              <p className="mt-4 text-lg text-white/90 max-w-lg">
                Web-based open platform for tourists to book tour packages, make payments,
                and enjoy a guided journey with our local tour riders.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/packages">
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold">
                    Book Your EV Bike Tour <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/app">
                  <Button size="lg" variant="outline" className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                    Try the mobile app
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking journey — 5 steps */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Tourist Booking Journey</h2>
          <p className="text-muted-foreground mt-2">From sign-up to your assigned rider in 5 simple steps.</p>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="hidden md:block absolute left-[10%] right-[10%] top-8 h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          {bookingJourney.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="mx-auto relative">
                <div className="grid place-items-center w-16 h-16 rounded-2xl bg-card shadow-card mx-auto">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{s.n}</span>
              </div>
              <div className="mt-4 font-semibold text-sm uppercase tracking-wide">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why this journey is better */}
      <section className="bg-hero text-primary-foreground py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Why this journey is better</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            {whyBetter.map((w) => (
              <div key={w.title} className="text-center px-2">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-white/15 backdrop-blur mx-auto">
                  <w.icon className="w-5 h-5" />
                </div>
                <div className="mt-3 font-semibold text-sm uppercase tracking-wide">{w.title}</div>
                <p className="text-xs opacity-90 mt-1">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour journey flow */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Tour Journey Flow & Rider Experience</h2>
          <p className="text-muted-foreground mt-2">What happens after your booking is confirmed.</p>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="hidden md:block absolute left-[10%] right-[10%] top-8 h-px bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20" />
          {tourJourney.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="mx-auto relative">
                <div className="grid place-items-center w-16 h-16 rounded-2xl bg-secondary/10 mx-auto">
                  <s.icon className="w-7 h-7 text-secondary" />
                </div>
                <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{s.n}</span>
              </div>
              <div className="mt-4 font-semibold text-sm uppercase tracking-wide">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works for all users */}
      <section className="bg-accent/40 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">How it works — for all users</h2>
            <p className="text-muted-foreground mt-2">One platform, two experiences.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: Users, title: "For Tourist", color: "bg-primary/10 text-primary",
                items: ["Register & choose package", "Make payment", "Get auto-assigned rider", "Enjoy the tour", "Real-time tracking", "Safe return to hub"],
                cta: { to: "/packages" as const, label: "Book a tour" },
              },
              {
                icon: ShieldCheck, title: "For Tour Rider", color: "bg-secondary/10 text-secondary",
                items: ["Receive auto assignment", "Pickup tourist", "Lead the tour route", "Ensure safety & experience", "Complete tour & return"],
                cta: { to: "/rider" as const, label: "Open Rider App" },
              },
            ].map((card) => (
              <Card key={card.title} className="rounded-2xl border-0 shadow-card">
                <CardContent className="p-6">
                  <div className={`grid place-items-center w-12 h-12 rounded-xl ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="mt-4 font-bold text-lg uppercase tracking-wide">{card.title}</div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {card.items.map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" /> <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={card.cta.to} className="mt-5 inline-flex items-center text-primary font-medium text-sm">
                    {card.cta.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Key Benefits</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {benefits.map((b) => (
            <Card key={b.title} className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-5 text-center">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
                  <b.icon className="w-5 h-5" />
                </div>
                <div className="mt-3 font-semibold text-sm">{b.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
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
