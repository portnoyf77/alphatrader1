import { Activity, RefreshCw, AlertTriangle, ArrowUp, Pause, Play, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ActivityLogEntry, ActivityEventType } from '@/lib/types';

interface StrategyActivityLogProps {
  activityLog: ActivityLogEntry[];
}

const eventConfig: Record<ActivityEventType, { icon: React.ElementType; color: string; label: string }> = {
  'rebalance': { icon: RefreshCw, color: 'text-primary', label: 'Rebalanced' },
  'risk_alert': { icon: AlertTriangle, color: 'text-warning', label: 'Risk Alert' },
  'version_upgrade': { icon: ArrowUp, color: 'text-violet-400', label: 'Version Upgrade' },
  'paused_new_allocations': { icon: Pause, color: 'text-warning', label: 'Allocations Paused' },
  'unpaused': { icon: Play, color: 'text-success', label: 'Allocations Resumed' },
  'inactive': { icon: XCircle, color: 'text-destructive', label: 'Deactivated' },
};

export function StrategyActivityLog({ activityLog }: StrategyActivityLogProps) {
  if (activityLog.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityLog.map((entry, idx) => {
            const config = eventConfig[entry.event_type];
            const Icon = config.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className={cn("p-1.5 rounded-full bg-background", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{config.label}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{entry.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
