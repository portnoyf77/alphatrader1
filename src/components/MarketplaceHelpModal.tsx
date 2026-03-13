import { HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GemDot } from '@/components/GemDot';
import { useState } from 'react';

export function MarketplaceHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        aria-label="How the Marketplace Works"
      >
        <HelpCircle className="h-5 w-5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-elevated max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">How the Marketplace Works</DialogTitle>
            <DialogDescription className="sr-only">
              Information about following portfolios, fees, risk levels, and rebalancing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <section>
              <h4 className="font-semibold text-foreground mb-2">Following a Portfolio</h4>
              <p className="text-muted-foreground">
                When you allocate capital to an Alpha's portfolio, your investment automatically mirrors their
                holdings and any changes they make. You don't need to manage individual trades.
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-foreground mb-2">Fees</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Alpha fee: 0.25% of your allocation annually (paid to the portfolio creator)</li>
                <li>• Platform fee: 0.25% of your allocation annually</li>
                <li>• Total cost: 0.50% annually</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-foreground mb-2">Risk Levels</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <GemDot name="Pearl-000" size={14} showTooltip={false} />
                  <span><strong className="text-foreground">Pearl — Conservative:</strong> focused on capital preservation and low volatility</span>
                </li>
                <li className="flex items-center gap-2">
                  <GemDot name="Sapphire-000" size={14} showTooltip={false} />
                  <span><strong className="text-foreground">Sapphire — Moderate:</strong> balances growth and stability (industry standard 1-2% risk per trade)</span>
                </li>
                <li className="flex items-center gap-2">
                  <GemDot name="Ruby-000" size={14} showTooltip={false} />
                  <span><strong className="text-foreground">Ruby — Aggressive:</strong> pursues maximum growth with higher risk (3%+ per trade)</span>
                </li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-foreground mb-2">What happens if the Alpha exits?</h4>
              <p className="text-muted-foreground">
                If an Alpha liquidates their portfolio, your allocation automatically exits as well.
                You will be notified immediately. You may receive less than your initial investment.
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-foreground mb-2">Rebalancing</h4>
              <p className="text-muted-foreground">
                Alphas may periodically rebalance their portfolios. By default, minor changes apply
                automatically and you are notified. You can change this to require your approval in
                Dashboard settings.
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-foreground mb-2">Validation Requirements</h4>
              <p className="text-muted-foreground">
                All portfolios listed on the marketplace have met minimum requirements: 30+ day track record,
                maximum drawdown under 20%, at least 5 unique holdings, and verified creator.
              </p>
            </section>
          </div>

          <Button onClick={() => setOpen(false)} className="w-full mt-4">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
