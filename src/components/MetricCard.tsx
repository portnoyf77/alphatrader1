import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  className?: string;
}

export function MetricCard({ label, value, icon, trend, tooltip, className }: MetricCardProps) {
  const content = (
    <Card className={cn("glass-card", tooltip && "cursor-help", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={cn(
          "text-2xl font-bold",
          trend === 'up' && "text-success",
          trend === 'down' && "text-destructive",
          trend === 'neutral' && "text-foreground"
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-[250px]">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}