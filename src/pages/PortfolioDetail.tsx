import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, TrendingUp, TrendingDown, Calendar, Sparkles, Wrench, Heart, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { PerformanceChart } from '@/components/PerformanceChart';
import { mockPortfolios, mockComments, formatCurrency, formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PortfolioDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const portfolio = mockPortfolios.find(p => p.id === id);

  if (!portfolio) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio not found</h1>
          <Button asChild>
            <Link to="/explore">Back to Explore</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following!",
      description: isFollowing 
        ? `You unfollowed ${portfolio.name}` 
        : `You're now following ${portfolio.name}`,
    });
  };

  const handleAllocate = () => {
    setShowAllocateModal(false);
    toast({
      title: "Allocation confirmed (prototype)",
      description: "In a live product, funds would be routed through a brokerage partner.",
    });
  };

  const estimatedFee = parseFloat(allocateAmount || '0') * 0.01; // 1% annual fee
  const creatorShare = estimatedFee * (portfolio.creator_fee_pct / 100);

  const isDisabled = portfolio.status === 'Live (coming soon)';

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/explore">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Link>
          </Button>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{portfolio.name}</h1>
                <StatusBadge status={portfolio.status} />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>by {portfolio.creator_name}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(portfolio.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant={isFollowing ? "secondary" : "outline"}
                onClick={handleFollow}
                disabled={isDisabled}
              >
                <Heart className={cn("h-4 w-4 mr-2", isFollowing && "fill-current text-destructive")} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button 
                onClick={() => setShowAllocateModal(true)}
                disabled={isDisabled}
                className="glow-primary"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Allocate (mock)
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">30d Return</p>
                <p className={cn(
                  "text-2xl font-bold flex items-center gap-1",
                  portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive"
                )}>
                  {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {formatPercent(portfolio.performance.return_30d)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Followers</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {portfolio.followers_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Allocated</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio.allocated_amount)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Consistency</p>
                <p className="text-2xl font-bold">
                  {portfolio.performance.consistency_score}/100
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="track-record">Track Record</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Strategy Summary */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Strategy Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                      {portfolio.strategy_type === 'GenAI' ? <Sparkles className="h-4 w-4 text-primary" /> : <Wrench className="h-4 w-4" />}
                      {portfolio.strategy_type}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                      {portfolio.objective}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                      {portfolio.risk_level} Risk
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Strategy Rationale</h4>
                    <p className="text-muted-foreground text-sm">{portfolio.description_rationale}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Risks</h4>
                    <p className="text-muted-foreground text-sm">{portfolio.risks}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Disclosure */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    ⚠️ Track record shown may include simulated performance. Simulated results do not guarantee future performance.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holdings">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Current Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.holdings.map((holding) => (
                        <TableRow key={holding.ticker}>
                          <TableCell className="font-medium">{holding.ticker}</TableCell>
                          <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                          <TableCell className="text-muted-foreground">{holding.sector}</TableCell>
                          <TableCell className="text-right">{holding.weight}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-4">
                    Last rebalanced: {new Date(portfolio.last_rebalanced_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="track-record">
              <PerformanceChart
                return30d={portfolio.performance.return_30d}
                return90d={portfolio.performance.return_90d}
                portfolioName={portfolio.name}
              />
            </TabsContent>

            <TabsContent value="discussion">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        {comment.likes}
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Comments are a prototype feature.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Allocate Modal */}
          <Dialog open={showAllocateModal} onOpenChange={setShowAllocateModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Allocate to {portfolio.name}</DialogTitle>
                <DialogDescription>
                  This is a mock allocation for prototype purposes.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Allocation Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    value={allocateAmount}
                    onChange={(e) => setAllocateAmount(e.target.value)}
                    className="bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground">Mock balance: $100,000</p>
                </div>

                {allocateAmount && parseFloat(allocateAmount) > 0 && (
                  <div className="p-4 rounded-lg bg-secondary space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Annual Fee (1%)</span>
                      <span>${estimatedFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creator Share ({portfolio.creator_fee_pct}%)</span>
                      <span>${creatorShare.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAllocateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAllocate}
                  disabled={!allocateAmount || parseFloat(allocateAmount) <= 0}
                  className="glow-primary"
                >
                  Confirm Allocation (mock)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}