import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { generateChartData } from '@/lib/mockData';

interface PerformanceChartProps {
  return30d: number;
  return90d: number;
  portfolioName: string;
}

export function PerformanceChart({ return30d, return90d, portfolioName }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<'30' | '90' | '365'>('90');
  
  const returnMap = {
    '30': return30d,
    '90': return90d,
    '365': return90d * 2.5,
  };
  
  const data = generateChartData(parseInt(timeframe), returnMap[timeframe]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Performance vs Benchmark</CardTitle>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '30' | '90' | '365')}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
            <TabsTrigger value="365">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              <Line
                type="monotone"
                dataKey="portfolio"
                name={portfolioName}
                stroke="hsl(262 83% 58%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(262 83% 58%)' }}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                name="S&P 500"
                stroke="hsl(220 10% 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(220 10% 50%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}