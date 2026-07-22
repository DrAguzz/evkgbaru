import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shrink-0">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
