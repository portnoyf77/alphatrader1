import { useState } from 'react';
import { Bell, Settings, X, CheckCircle, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { GemDot } from '@/components/GemDot';
import { getGemHex } from '@/lib/portfolioNaming';
import { useToast } from '@/hooks/use-toast';
import { usePendingUpdates } from '@/hooks/usePortfolios';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/lib/types';

export function NotificationBell() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Portfolio | null>(null);
  const [rebalancingModalOpen, setRebalancingModalOpen] = useState(false);
  const [rebalancingMode, setRebalancingMode] = useState<'auto' | 'manual'>(() => {
    const saved = localStorage.getItem('rebalancingMode');
    return saved === 'manual' ? 'manual' : 'auto';
  });

  const { data: strategiesWithPending = [], isLoading } = usePendingUpdates();
  const count = strategiesWithPending.length;

  const handleAccept = (strategy: Portfolio) => {
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
      toast({
        title: "Exited portfolio (prototype)",
        description: `You've exited ${selectedStrategy.name}. In a live product, funds would return to your brokerage account.`,
      });
    }
    setExitDialogOpen(false);
    setSelectedStrategy(null);
  };

  const badgeColor = rebalancingMode === 'auto' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]';

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-secondary touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-0 md:min-w-0 md:p-2"
              aria-label={count > 0 ? `${count} pending notifications` : 'Notifications'}
            >
              <Bell className="h-5 w-5 text-[rgba(255,255,255,0.6)] hover:text-foreground transition-colors" />
              {count > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-bold",
                  "min-w-[18px] h-[18px] text-[0.7rem] leading-none px-1",
                  badgeColor
                )}>
                  {count}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {count > 0 ? `${count} pending update${count > 1 ? 's' : ''}` : 'No notifications'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[420px] sm:max-w-[420px] bg-[rgba(5,5,8,0.95)] backdrop-blur-[20px] border-l border-[rgba(255,255,255,0.06)] p-0"
          style={{ boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
            <SheetTitle className="text-[1.25rem] font-bold font-heading">Notifications</SheetTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setRebalancingModalOpen(true)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-0 md:min-w-0 md:p-1.5"
                      aria-label="Rebalancing settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Rebalancing settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="h-10 w-10 text-success/50 mb-4" />
                <p className="font-semibold text-foreground mb-1">All caught up</p>
                <p className="text-sm text-muted-foreground">No pending portfolio updates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {strategiesWithPending.map((strategy, i) => {
                  const borderColor = getGemHex(strategy.name).color;
                  return (
                    <div
                      key={strategy.id}
                      className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]"
                      style={{
                        borderLeft: `3px solid ${borderColor}`,
                        borderBottom: i < count - 1 ? undefined : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GemDot name={strategy.name} />
                        <span className="font-semibold text-sm">{strategy.name}</span>
                        {rebalancingMode === 'auto' ? (
                          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Auto-applied
                          </span>
                        ) : (
                          <span className="ml-auto px-2 py-0.5 rounded text-[0.7rem] font-medium bg-[rgba(245,158,11,0.12)] text-[#F59E0B]">
                            Update pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {strategy.pending_change_summary}
                      </p>
                      {rebalancingMode === 'auto' ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          Auto-applied — you have been notified.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <ArrowRight className="h-3 w-3" />
                            If you don't respond within {strategy.exit_window_days} days, you'll be auto-exited
                          </p>
                          <div className="flex gap-2">
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Exit confirmation dialog */}
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
            <Button variant="outline" onClick={() => setExitDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmExit}>Confirm Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rebalancing Mode Modal */}
      <Dialog open={rebalancingModalOpen} onOpenChange={setRebalancingModalOpen}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rebalancing Mode</DialogTitle>
            <DialogDescription>
              Choose how portfolio updates from Alphas you follow are handled.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={rebalancingMode} onValueChange={(v) => {
            const mode = v as 'auto' | 'manual';
            setRebalancingMode(mode);
            localStorage.setItem('rebalancingMode', mode);
          }} className="space-y-3 py-4">
            <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer", rebalancingMode === 'auto' ? "border-primary bg-primary/5" : "border-border")}>
              <RadioGroupItem value="auto" id="notif-auto" className="mt-0.5" />
              <Label htmlFor="notif-auto" className="cursor-pointer">
                <p className="font-medium">Auto-apply and notify me</p>
                <p className="text-xs text-muted-foreground mt-1">Rebalancing changes are applied automatically. You'll be notified after.</p>
              </Label>
            </div>
            <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer", rebalancingMode === 'manual' ? "border-primary bg-primary/5" : "border-border")}>
              <RadioGroupItem value="manual" id="notif-manual" className="mt-0.5" />
              <Label htmlFor="notif-manual" className="cursor-pointer">
                <p className="font-medium">Require my approval</p>
                <p className="text-xs text-muted-foreground mt-1">You must review and accept each update before it applies.</p>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            By selecting Auto-apply, you authorize Alpha Trader to rebalance your portfolio automatically. This does not constitute investment advice.
          </p>
          <DialogFooter>
            <Button onClick={() => setRebalancingModalOpen(false)}>Save Preference</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
