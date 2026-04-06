import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAccountInfo,
  getLatestQuote,
  type AlpacaAccountInfo,
  type AlpacaLatestQuote,
} from "@/lib/alpacaClient";
import { cn } from "@/lib/utils";

export function AlpacaConnectionTest() {
  const [account, setAccount] = useState<AlpacaAccountInfo | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("AAPL");
  const [quote, setQuote] = useState<AlpacaLatestQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const data = await getAccountInfo();
      setAccount(data);
    } catch (e) {
      setAccount(null);
      setAccountError(
        e instanceof Error ? e.message : "Failed to load account",
      );
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleFetchQuote = async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);
    try {
      const data = await getLatestQuote(symbol);
      setQuote(data);
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : "Failed to fetch quote");
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-lg space-y-6 p-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Alpaca connection</CardTitle>
            <CardDescription>Paper trading account (dev proxy)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full max-w-xs" />
              </div>
            )}
            {!accountLoading && accountError && (
              <Alert variant="destructive">
                <AlertTitle>Account error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>{accountError}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadAccount}
                    className="shrink-0"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!accountLoading && account && !accountError && (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="label-meta mb-1">Status</dt>
                  <dd className="text-lg font-medium tabular-nums">
                    {account.status}
                  </dd>
                </div>
                <div>
                  <dt className="label-meta mb-1">Buying power</dt>
                  <dd className="text-lg font-medium tabular-nums">
                    {account.currency} {account.buying_power}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Latest quote</CardTitle>
            <CardDescription>
              Fetch NBBO from the market data API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="alpaca-symbol">Symbol</Label>
                <Input
                  id="alpaca-symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  autoCapitalize="characters"
                  className="font-mono uppercase"
                />
              </div>
              <Button
                type="button"
                onClick={handleFetchQuote}
                disabled={quoteLoading || !symbol.trim()}
                className="shrink-0 sm:min-w-[120px]"
              >
                {quoteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  "Get Quote"
                )}
              </Button>
            </div>

            {quoteError && (
              <Alert variant="destructive">
                <AlertTitle>Quote error</AlertTitle>
                <AlertDescription>{quoteError}</AlertDescription>
              </Alert>
            )}

            {quote && !quoteError && (
              <div
                className={cn(
                  "rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(22,22,40,0.4)] p-4",
                )}
              >
                <p className="label-meta mb-3">{quote.symbol}</p>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Bid</dt>
                    <dd className="text-xl font-semibold tabular-nums text-success">
                      {quote.bidPrice.toFixed(4)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Ask</dt>
                    <dd className="text-xl font-semibold tabular-nums text-primary">
                      {quote.askPrice.toFixed(4)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                  {quote.timestamp}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
