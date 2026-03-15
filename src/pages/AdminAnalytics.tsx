import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Globe, MapPin, Monitor, Smartphone, Tablet, Clock, Eye, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  totalPageviews: number;
  totalVisitors: number;
  avgTimeOnPage: number;
  cityBreakdown: { city: string; region: string; country: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
  topPages: { page: string; count: number }[];
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  recentViews: { id: string; page_path: string; city: string; region: string; country: string; visited_at: string; time_on_page: number }[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supabase.functions.invoke('analytics-dashboard');
      if (response.error) throw response.error;
      setData(response.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'No data available'}</p>
          <Button onClick={fetchAnalytics} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visitor Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">City-level tracking with geolocation</p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.totalPageviews}</p>
                  <p className="text-xs text-muted-foreground">Total Pageviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.totalVisitors}</p>
                  <p className="text-xs text-muted-foreground">Unique Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(data.avgTimeOnPage)}</p>
                  <p className="text-xs text-muted-foreground">Avg Time on Page</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.countryBreakdown.length}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">{data.deviceBreakdown.desktop}</p>
                <p className="text-xs text-muted-foreground">Desktop</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">{data.deviceBreakdown.mobile}</p>
                <p className="text-xs text-muted-foreground">Mobile</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-3">
              <Tablet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">{data.deviceBreakdown.tablet}</p>
                <p className="text-xs text-muted-foreground">Tablet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cities" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="cities" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Cities
            </TabsTrigger>
            <TabsTrigger value="countries" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Countries
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Top Pages
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cities">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Visitors by City</CardTitle>
              </CardHeader>
              <CardContent>
                {data.cityBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No city data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cityBreakdown.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.city}</TableCell>
                          <TableCell className="text-muted-foreground">{row.region}</TableCell>
                          <TableCell className="text-muted-foreground">{row.country}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Visitors by Country</CardTitle>
              </CardHeader>
              <CardContent>
                {data.countryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No country data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.countryBreakdown.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.country}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No page data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPages.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">{row.page}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentViews.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No visits yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Time on Page</TableHead>
                        <TableHead className="text-right">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentViews.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-sm">{row.page_path}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {[row.city, row.region, row.country].filter(Boolean).join(', ') || 'Unknown'}
                          </TableCell>
                          <TableCell>{row.time_on_page ? formatDuration(row.time_on_page) : '—'}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {new Date(row.visited_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
