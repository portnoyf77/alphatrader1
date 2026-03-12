import { CheckCircle2, Clock, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ValidationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ValidationBadgeProps {
  status: ValidationStatus;
  className?: string;
  showTooltip?: boolean;
}

const statusConfig: Record<ValidationStatus, {
  label: string;
  icon: React.ReactNode;
  className: string;
  tooltip: string;
}> = {
  simulated: {
    label: 'Simulated',
    icon: <FlaskConical className="h-3 w-3" />,
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
    tooltip: 'This portfolio has only paper-trading history and is not publicly listed.',
  },
  in_validation: {
    label: 'In Validation',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-warning/20 text-warning border-warning/30',
    tooltip: 'This portfolio is being validated for consistency, drawdown, and volatility.',
  },
  validated: {
    label: 'Validated',
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: 'bg-success/20 text-success border-success/30',
    tooltip: 'This portfolio has completed validation and meets performance stability criteria.',
  },
};

export function ValidationBadge({ status, className, showTooltip = true }: ValidationBadgeProps) {
  const config = statusConfig[status];
  
  const badge = (
    <Badge 
      variant="outline" 
      className={cn('flex items-center gap-1', config.className, className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
