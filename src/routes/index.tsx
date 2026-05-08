import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, MapPin, Shield, Clock, Star, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EVRide — Guided EV Bike Tours in Kuala Lumpur" },
      { name: "description", content: "Discover Kuala Lumpur on a silent EV bike with a local guide. Heritage rides, food trails, Merdeka tours and more." },
      { property: "og:title", content: "EVRide — Guided EV Bike Tours in Kuala Lumpur" },
      { property: "og:description", content: "Book a premium EV bike tour around KL with a guided rider." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-95" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1600)",
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div className="container relative mx-auto px-4 py-24 md:py-32 text-primary-foreground">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
              <Bike className="w-3.5 h-3.5" /> Silent. Clean. Guided.
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
              Explore Kuala Lumpur<br />on an EV bike.
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg">
              Premium guided e-bike tours through KLCC, Kampung Baru, Merdeka Square and more. Book in seconds — your local rider takes care of the rest.
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
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Bike, title: "100% Electric", desc: "Silent EV bikes for clean city rides." },
            { icon: MapPin, title: "Local Routes", desc: "Curated KL heritage & food trails." },
            { icon: Shield, title: "Licensed Riders", desc: "Trained guides + safety briefing." },
            { icon: Clock, title: "Flexible Slots", desc: "Daily slots, easy booking." },
          ].map((h) => (
            <Card key={h.title} className="rounded-2xl shadow-card border-0">
              <CardContent className="p-6">
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-accent text-primary mb-4">
                  <h.icon className="w-5 h-5" />
                </span>
                <div className="font-semibold">{h.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{h.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center">How it works</h2>
        <div className="mt-10 grid md:grid-cols-4 gap-6">
          {[
            { n: 1, title: "Choose package", desc: "Browse curated KL tour packages." },
            { n: 2, title: "Book & pay", desc: "Pick a date, time and pax. Pay securely." },
            { n: 3, title: "Meet your rider", desc: "We auto-assign a local guide." },
            { n: 4, title: "Enjoy the ride", desc: "Track checkpoints in real time." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-soft">
                {s.n}
              </div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular packages teaser */}
      <section className="bg-accent/40 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Popular tour packages</h2>
              <p className="text-muted-foreground">A taste of KL on two electric wheels.</p>
            </div>
            <Link to="/packages" className="text-primary font-medium hidden md:inline-flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "KL Heritage Ride", time: "2h 30m", price: "RM150", img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800" },
              { name: "Kampung Baru Food Ride", time: "1h 30m", price: "RM90", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" },
              { name: "Merdeka City Ride", time: "2h 0m", price: "RM120", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800" },
            ].map((p) => (
              <Card key={p.name} className="overflow-hidden rounded-2xl border-0 shadow-card">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-primary font-bold">{p.price}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {p.time}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/packages"><Button variant="outline">View all packages</Button></Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Why ride with EVRide?</h2>
            <ul className="mt-6 space-y-3">
              {[
                "Zero emission, silent EV bikes",
                "Insured tours with safety briefing",
                "Real-time checkpoint tracking",
                "Cashless payment, instant confirmation",
                "Multilingual local riders",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="rounded-2xl shadow-card border-0 bg-hero text-primary-foreground">
            <CardContent className="p-8">
              <Star className="w-6 h-6 mb-3" />
              <p className="text-lg leading-relaxed italic">
                "Best way to see KL — our rider Ahmad showed us hidden food spots in Kampung Baru we'd never have found ourselves."
              </p>
              <div className="mt-4 text-sm font-medium">— Sarah, Singapore</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="rounded-3xl bg-hero text-primary-foreground border-0 shadow-soft">
          <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Ready to ride?</h3>
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
