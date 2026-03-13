import { useState } from 'react';
import { DollarSign, Users, ArrowRight, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function AlphaEarningsCalculator() {
  const [followers, setFollowers] = useState([500]);
  const [avgAllocation, setAvgAllocation] = useState([5000]);

  // Alpha earns 0.25% of follower AUM annually, platform takes 0.25%
  const totalAllocated = followers[0] * avgAllocation[0];
  const alphaShare = totalAllocated * 0.0025; // 0.25% AUM annually to Alpha
  const platformFee = totalAllocated * 0.0025; // 0.25% AUM annually to platform
  const monthlyEarnings = alphaShare / 12;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Alpha Earnings Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Followers Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Followers
            </Label>
            <span className="text-lg font-semibold text-primary">
              {followers[0].toLocaleString()}
            </span>
          </div>
          <Slider
            value={followers}
            onValueChange={setFollowers}
            min={100}
            max={5000}
            step={100}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>100</span>
            <span>5,000</span>
          </div>
        </div>

        {/* Average Allocation Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Avg. Allocation per Investor
            </Label>
            <span className="text-lg font-semibold text-primary">
              ${avgAllocation[0].toLocaleString()}
            </span>
          </div>
          <Slider
            value={avgAllocation}
            onValueChange={setAvgAllocation}
            min={1000}
            max={25000}
            step={500}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$1,000</span>
            <span>$25,000</span>
          </div>
        </div>

        {/* Calculation Breakdown */}
        <div className="pt-4 border-t border-border/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total AUM</span>
              <span className="font-mono tabular-nums">${totalAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Your share (0.25% AUM)</span>
              <span className="font-mono tabular-nums">${alphaShare.toLocaleString()}/year</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee (0.25% AUM)</span>
              <span className="font-mono tabular-nums">${platformFee.toLocaleString()}/year</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">
            Your estimated monthly earnings
          </p>
          <p className="font-mono tabular-nums text-success earnings-glow" style={{ fontSize: '2rem', fontWeight: 700 }}>
            ${Math.round(monthlyEarnings).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            That's <span className="font-mono">${Math.round(alphaShare).toLocaleString()}</span> per year
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Based on 0.25% annual Alpha share of follower AUM. 
          Actual earnings depend on allocation and retention.
        </p>
      </CardContent>
    </Card>
  );
}
