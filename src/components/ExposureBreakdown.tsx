import { PieChart, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ExposureBreakdown as ExposureBreakdownType } from '@/lib/types';

interface ExposureBreakdownProps {
  exposure: ExposureBreakdownType[];
  topThemes: string[];
  disclosureText: string;
  isMasked: boolean;
}

const colorClasses = [
  'bg-primary',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-emerald-500',
  'bg-pink-500',
];

export function ExposureBreakdown({ exposure, topThemes, disclosureText, isMasked }: ExposureBreakdownProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {isMasked ? 'Exposure Breakdown' : 'Allocation Overview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* IP Protection Callout for Masked Strategies */}
        {isMasked && (
          <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-violet-400">IP-Protected Strategy</p>
                <p className="text-sm text-muted-foreground mt-1">{disclosureText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exposure Bars */}
        <div className="space-y-3">
          {exposure.map((item, idx) => (
            <TooltipProvider key={idx} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.percent}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", colorClasses[idx % colorClasses.length])}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {item.percent}% allocation to {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Top Themes */}
        {topThemes.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Key Themes</p>
            <div className="flex flex-wrap gap-2">
              {topThemes.map((theme, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transparency indicator */}
        <div className="pt-4 border-t border-border/50">
          <div className={cn(
            "flex items-center gap-2 text-sm p-2 rounded-lg",
            isMasked ? "bg-violet-500/10 text-violet-400" : "bg-cyan-500/10 text-cyan-400"
          )}>
            {isMasked ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Exact holdings and weights are hidden</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Full holdings transparency - see Holdings tab</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
