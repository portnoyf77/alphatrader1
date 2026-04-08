import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AccentColor = 'purple' | 'blue' | 'green' | 'amber' | 'emerald';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  accent?: AccentColor;
  className?: string;
}

const accentColors: Record<AccentColor, string> = {
  purple: 'before:bg-primary',
  blue: 'before:bg-[#3B82F6]',
  green: 'before:bg-success',
  amber: 'before:bg-warning',
  emerald: 'before:bg-success',
};

export function MetricCard({ label, value, icon, trend, tooltip, accent, className }: MetricCardProps) {
  const content = (
    <Card className={cn(
      "glass-card relative overflow-hidden",
      accent && "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-2xl",
      accent && accentColors[accent],
      tooltip && "cursor-help",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="label-meta">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={cn(
          "stat-number",
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
