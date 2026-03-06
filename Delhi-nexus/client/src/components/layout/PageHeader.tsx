import { ReactNode } from "react";
import { format } from "date-fns";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <header className="glass-panel border-x-0 border-t-0 px-8 py-5 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {title}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">{description}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
            <span className="text-xs font-mono text-success">LIVE SYSTEM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-sm font-mono text-muted-foreground">
            {format(new Date(), "HH:mm:ss 'IST'")}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {format(new Date(), "dd MMM yyyy")}
          </span>
        </div>
        {action && (
          <div className="pl-6 border-l border-border/50">{action}</div>
        )}
      </div>
    </header>
  );
}
