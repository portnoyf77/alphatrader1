import { cn } from '@/lib/utils';
import type { PortfolioStatus } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusBadgeProps {
  status: PortfolioStatus;
  className?: string;
}

const statusTooltips: Record<PortfolioStatus, string> = {
  'Simulated': 'This portfolio is running in simulation mode with paper trading',
  'Live': 'This portfolio is live and actively trading with real capital',
  'Live (coming soon)': 'Live trading will be available soon for this portfolio',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help",
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
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-[200px]">
          {statusTooltips[status]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}