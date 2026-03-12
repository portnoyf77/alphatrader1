import { PieChart, Lock, Briefcase, Globe, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ExposureBreakdown as ExposureBreakdownType, GeoFocus } from '@/lib/types';

interface ExposureBreakdownProps {
  exposure: ExposureBreakdownType[];
  topThemes: string[];
  disclosureText: string;
  sectors: string[];
  geoFocus: GeoFocus;
  allowedAssets: string[];
  lastRebalanced: string;
}

const colorClasses = [
  'bg-primary',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-emerald-500',
  'bg-pink-500',
];

export function ExposureBreakdown({ 
  exposure, 
  topThemes, 
  disclosureText, 
  sectors, 
  geoFocus, 
  allowedAssets,
  lastRebalanced 
}: ExposureBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* IP Protection Callout */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-violet-400">IP-Protected Portfolio</p>
              <p className="text-sm text-muted-foreground mt-1">
                Exact holdings and weights are hidden to protect the creator's intellectual property. 
                Below you'll find high-level exposure information to help you understand the portfolio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    Approximately {item.percent}% of the portfolio is allocated to {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </CardContent>
        </Card>

        {/* Portfolio Characteristics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Characteristics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Industries/Sectors */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Briefcase className="h-4 w-4" />
                <span>Industries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Geographic Focus */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Globe className="h-4 w-4" />
                <span>Geographic Focus</span>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm">
                {geoFocus}
              </span>
            </div>

            {/* Fund Types */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <PieChart className="h-4 w-4" />
                <span>Instrument Types</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allowedAssets.map((asset, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                    {asset}
                  </span>
                ))}
              </div>
            </div>

            {/* Last Rebalanced */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Last Rebalanced</span>
              </div>
              <span className="text-sm">
                {new Date(lastRebalanced).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Themes */}
      {topThemes.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Key Investment Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topThemes.map((theme, idx) => (
                <span 
                  key={idx} 
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {disclosureText}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
