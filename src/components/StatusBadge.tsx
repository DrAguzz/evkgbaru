import { STATUS_COLORS, labelStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", cls, className)}>
      {labelStatus(status)}
    </span>
  );
}
