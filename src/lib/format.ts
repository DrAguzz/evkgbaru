export const money = (n: number | string) => `RM${Number(n).toFixed(2)}`;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const fmtTime = (t: string) => t.slice(0, 5);
export const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  paid: "bg-secondary/15 text-secondary-foreground border-secondary/30",
  confirmed: "bg-secondary/15 text-secondary-foreground border-secondary/30",
  assigned: "bg-primary/15 text-primary border-primary/30",
  accepted: "bg-primary/15 text-primary border-primary/30",
  pickup: "bg-primary/15 text-primary border-primary/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  no_show: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-border",
  available: "bg-success/15 text-success border-success/30",
  busy: "bg-warning/15 text-warning border-warning/30",
  offline: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
};

export const labelStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
