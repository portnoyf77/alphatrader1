import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { generateChartData } from '@/lib/mockData';

type TimeframeKey = '30' | '90' | 'ytd' | '1y' | 'all';

interface PerformanceChartProps {
  return30d: number;
  return90d: number;
  portfolioName: string;
}

export function PerformanceChart({ return30d, return90d, portfolioName }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('30');
  
  // Calculate days for each timeframe
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const ytdDays = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  const daysMap: Record<TimeframeKey, number> = {
    '30': 30,
    '90': 90,
    'ytd': ytdDays,
    '1y': 365,
    'all': 730, // 2 years as "all time" for mock
  };
  
  const returnMap: Record<TimeframeKey, number> = {
    '30': return30d,
    '90': return90d,
    'ytd': return90d * (ytdDays / 90),
    '1y': return90d * 2.5,
    'all': return90d * 4,
  };
  
  const data = generateChartData(daysMap[timeframe], returnMap[timeframe]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Performance vs Benchmark</CardTitle>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeKey)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
            <TabsTrigger value="ytd">YTD</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="perfPortfolioFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="perfBenchmarkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(220 10% 60%)"
                tick={{ fill: 'hsl(220 10% 60%)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(220 10% 60%)"
                tick={{ fill: 'hsl(220 10% 60%)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(240 10% 9%)',
                  border: '1px solid hsl(240 10% 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(220 20% 95%)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="portfolio"
                fill="url(#perfPortfolioFill)"
                stroke="none"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                fill="url(#perfBenchmarkFill)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                name={portfolioName}
                stroke="hsl(262 83% 58%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(262 83% 58%)' }}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                name="S&P 500"
                stroke="hsl(var(--success))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--success))' }}
              />
              <Line
                type="monotone"
                dataKey="dowJones"
                name="Dow Jones"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--muted-foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}