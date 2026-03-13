import { RefreshCw, ArrowUp, Pause, Play, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Strategy } from '@/lib/types';

interface StrategyControlsProps {
  strategy: Strategy;
  onRebalance?: () => void;
  onMajorUpdate?: () => void;
  onTogglePause?: () => void;
  onLiquidate?: () => void;
}

export function StrategyControls({ 
  strategy, 
  onRebalance, 
  onMajorUpdate, 
  onTogglePause, 
  onLiquidate 
}: StrategyControlsProps) {
  const { toast } = useToast();
  const [liquidateDialogOpen, setLiquidateDialogOpen] = useState(false);
  const [majorUpdateDialogOpen, setMajorUpdateDialogOpen] = useState(false);

  const isPaused = strategy.new_allocations_paused;
  const isInactive = strategy.status === 'inactive';

  const handleRebalance = () => {
    onRebalance?.();
    toast({
      title: "Rebalance initiated (prototype)",
      description: "Minor rebalance will apply automatically to all followers. Version incremented to next minor.",
    });
  };

  const handleMajorUpdateConfirm = () => {
    setMajorUpdateDialogOpen(false);
    onMajorUpdate?.();
    toast({
      title: "Major update proposed (prototype)",
      description: "Followers will be notified and must opt-in to continue. New version will be created.",
    });
  };

  const handleTogglePause = () => {
    onTogglePause?.();
    toast({
      title: isPaused ? "Allocations resumed (prototype)" : "Allocations paused (prototype)",
      description: isPaused 
        ? "New followers can now allocate to this portfolio."
        : "New allocations are temporarily paused. Existing followers are unaffected.",
    });
  };

  const handleLiquidateConfirm = () => {
    setLiquidateDialogOpen(false);
    onLiquidate?.();
    toast({
      title: "Portfolio liquidated (prototype)",
      description: "All followers have been auto-exited. Portfolio removed from marketplace.",
      variant: "destructive",
    });
  };

  if (isInactive) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
        <p className="text-sm text-destructive">This portfolio has been liquidated and is no longer active.</p>
      </div>
    );
  }

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRebalance}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rebalance
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">
              Minor rebalance - applies automatically to followers without opt-in
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setMajorUpdateDialogOpen(true)}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Propose Major Update
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">
              Structural change - requires follower opt-in and creates new version
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTogglePause}
                className={isPaused ? "text-success border-success/50" : "text-warning border-warning/50"}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Allocations
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Allocations
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">
              {isPaused 
               ? "Allow new investors to allocate to this portfolio"
                 : "Temporarily stop accepting new allocations"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLiquidateDialogOpen(true)}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Liquidate
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">
              Permanently deactivate this portfolio and exit all followers
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Major Update Dialog */}
      <Dialog open={majorUpdateDialogOpen} onOpenChange={setMajorUpdateDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Propose Major Update
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Major changes require follower opt-in and will create a new portfolio configuration.</p>
              <p className="text-warning">Followers who don&apos;t approve within {strategy.exit_window_days} days will be auto-exited.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMajorUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMajorUpdateConfirm}>
              Propose Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liquidate Dialog */}
      <Dialog open={liquidateDialogOpen} onOpenChange={setLiquidateDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Liquidate and deactivate this portfolio?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Exit all {strategy.followers_count.toLocaleString()} followers (prototype)</li>
                <li>Remove the portfolio from the marketplace</li>
                <li>Mark it as permanently inactive</li>
              </ul>
              <p className="text-destructive font-medium">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLiquidateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLiquidateConfirm}>
              Liquidate Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
