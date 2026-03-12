import { AlertTriangle, Check, CheckCircle, X, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GemDot } from '@/components/GemDot';
import type { Portfolio } from '@/lib/types';

interface PendingUpdatesPanelProps {
  strategies: Portfolio[];
  rebalancingMode?: 'auto' | 'manual';
  onAccept?: (strategyId: string) => void;
  onExit?: (strategyId: string) => void;
}

export function PendingUpdatesPanel({ strategies, rebalancingMode = 'auto', onAccept, onExit }: PendingUpdatesPanelProps) {
  const { toast } = useToast();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Portfolio | null>(null);

  const strategiesWithPending = strategies.filter(s => s.pending_update !== undefined);

  if (strategiesWithPending.length === 0) {
    return null;
  }

  const handleAccept = (strategy: Portfolio) => {
    onAccept?.(strategy.id);
    toast({
      title: "Update accepted (prototype)",
      description: `You've accepted the update for ${strategy.name}. Your allocation will continue under the new portfolio configuration.`,
    });
  };

  const handleExitClick = (strategy: Portfolio) => {
    setSelectedStrategy(strategy);
    setExitDialogOpen(true);
  };

  const confirmExit = () => {
    if (selectedStrategy) {
      onExit?.(selectedStrategy.id);
      toast({
        title: "Exited portfolio (prototype)",
        description: `You've exited ${selectedStrategy.name}. In a live product, funds would return to your brokerage account.`,
      });
    }
    setExitDialogOpen(false);
    setSelectedStrategy(null);
  };

  return (
    <>
      <Card className="glass-card border-warning/30 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Pending Portfolio Updates ({strategiesWithPending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The following portfolios have published major updates that require your approval to continue.
          </p>
          
          {strategiesWithPending.map((strategy) => (
            <div key={strategy.id} className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold flex items-center gap-2"><GemDot name={strategy.name} />{strategy.name}</span>
                    <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 text-xs font-medium">
                      Update pending
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {strategy.pending_change_summary}
                  </p>
                </div>
                {rebalancingMode === 'auto' ? (
                  <div className="flex items-center gap-2 shrink-0 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Auto-applied</span>
                  </div>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExitClick(strategy)}
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Exit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(strategy)}
                      className="bg-success hover:bg-success/90"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                )}
              </div>
              {rebalancingMode === 'auto' ? (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Auto-applied — you have been notified.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  If you don't respond within {strategy.exit_window_days} days, you'll be auto-exited
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exit Confirmation Dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Exit Portfolio?</DialogTitle>
            <DialogDescription>
              You are exiting <span className="font-medium text-foreground">{selectedStrategy?.name}</span>.
              In a live product, funds would return to your brokerage account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExitDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Confirm Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
