import { MapPin, Navigation, Flag, Bike, Radio } from "lucide-react";

export interface RouteStop {
  id: string;
  name: string;
  reached?: boolean;
  current?: boolean;
}

interface Props {
  stops: RouteStop[];
  title?: string;
  className?: string;
  live?: boolean;
}

/**
 * Stylised route map showing checkpoints connected by a curved path.
 * Mimics a tracking map without requiring a real map provider.
 */
export function RouteMap({ stops, title = "Tour route", className = "" }: Props) {
  const n = Math.max(stops.length, 2);
  // Compute positions along a gentle S-curve
  const points = stops.map((_, i) => {
    const t = i / (n - 1);
    const x = 8 + t * 84; // 8% → 92%
    const y = 70 - Math.sin(t * Math.PI) * 40 + (i % 2 === 0 ? -4 : 4); // wave
    return { x, y };
  });

  // Build smooth path
  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${cx} ${prev.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  // Done segment ends at last reached stop
  const lastReachedIdx = stops.reduce((acc, s, i) => (s.reached ? i : acc), -1);
  const donePath = lastReachedIdx > 0
    ? points
        .slice(0, lastReachedIdx + 1)
        .map((p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          return `Q ${cx} ${prev.y} ${p.x} ${p.y}`;
        })
        .join(" ")
    : "";

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[linear-gradient(135deg,#e8f3ef_0%,#dbeae2_50%,#e6efe8_100%)] ${className}`}>
      {/* faux map grid */}
      <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* faux roads */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 30 Q 30 25 60 35 T 100 30" stroke="white" strokeWidth="3" fill="none" />
        <path d="M0 75 Q 40 80 70 70 T 100 78" stroke="white" strokeWidth="2" fill="none" />
        <path d="M25 0 Q 30 40 35 100" stroke="white" strokeWidth="2" fill="none" />
        <path d="M70 0 Q 75 50 80 100" stroke="white" strokeWidth="2" fill="none" />
      </svg>

      <div className="aspect-[16/8] relative">
        {/* Route path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={pathD} stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeDasharray="2 1.2" />
          {donePath && (
            <path d={donePath} stroke="hsl(var(--primary))" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {/* Stop markers */}
        {stops.map((s, i) => {
          const p = points[i];
          const isStart = i === 0;
          const isEnd = i === stops.length - 1;
          const Icon = isStart ? Navigation : isEnd ? Flag : MapPin;
          const color = s.reached
            ? "bg-success text-success-foreground"
            : s.current
            ? "bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse"
            : "bg-card text-primary border border-border";
          return (
            <div
              key={s.id + i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className={`grid place-items-center w-8 h-8 rounded-full shadow-md ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-background/90 backdrop-blur whitespace-nowrap shadow-sm max-w-[110px] truncate">
                {i + 1}. {s.name}
              </span>
            </div>
          );
        })}

        {/* Title chip */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-background/90 backdrop-blur shadow-sm">
          <Navigation className="w-3 h-3 text-primary" /> {title}
        </div>
      </div>
    </div>
  );
}
