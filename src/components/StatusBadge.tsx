import { cn } from '@/lib/utils';
import type { PortfolioStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: PortfolioStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        status === 'Simulated' && "bg-primary/20 text-primary",
        status === 'Live' && "bg-success/20 text-success",
        status === 'Live (coming soon)' && "bg-muted text-muted-foreground",
        className
      )}
    >
      {status === 'Live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
      )}
      {status}
    </span>
  );
}