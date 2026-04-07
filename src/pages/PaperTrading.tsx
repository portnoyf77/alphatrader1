import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  getAccountInfo,
  getOrders,
  getPositions,
  placeOrder,
  cancelOrder,
  type AlpacaAccountInfo,
  type AlpacaOrder,
  type AlpacaOrderSide,
  type AlpacaPosition,
} from "@/lib/alpacaClient";
import { StockChart } from "@/components/StockChart";
import { cn } from "@/lib/utils";

const REFRESH_MS = 15_000;

function formatUsd(value: string) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatSubmitted(at: string) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString();
}

function PaperPositionsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Avg entry</TableHead>
          <TableHead className="text-right">Current</TableHead>
          <TableHead className="text-right">Unrealized P&amp;L</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaperOrdersSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Side</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Filled avg</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-7 w-14 ml-auto rounded-md" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function PaperTrading() {
  const { toast } = useToast();

  const [account, setAccount] = useState<AlpacaAccountInfo | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState("1");
  const [side, setSide] = useState<AlpacaOrderSide>("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [placing, setPlacing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [portfolioTablesReady, setPortfolioTablesReady] = useState(false);
  const [qtyBlurred, setQtyBlurred] = useState(false);

  const qtyNum = useMemo(() => parseFloat(quantity.trim()), [quantity]);
  const quantityValid =
    quantity.trim() !== "" && !Number.isNaN(qtyNum) && qtyNum > 0;
  const showQtyError = qtyBlurred && !quantityValid;

  const loadAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const data = await getAccountInfo();
      setAccount(data);
    } catch (e) {
      setAccount(null);
      setAccountError(e instanceof Error ? e.message : "Failed to load account");
    } finally {
      setAccountLoading(false);
    }
  }, []);

  const loadPositionsAndOrders = useCallback(async () => {
    setPositionsError(null);
    setOrdersError(null);
    try {
      const [pos, ord] = await Promise.all([getPositions(), getOrders(40)]);
      setPositions(pos);
      setOrders(ord);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setPositionsError(msg);
      setOrdersError(msg);
    } finally {
      setPortfolioTablesReady(true);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    loadPositionsAndOrders();
    const id = window.setInterval(loadPositionsAndOrders, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadPositionsAndOrders]);

  const handlePlaceOrder = async () => {
    const sym = symbol.trim().toUpperCase();
    const qtyRaw = quantity.trim();
    if (!sym || !qtyRaw) {
      toast({
        title: "Missing fields",
        description: "Enter a symbol and quantity.",
        variant: "destructive",
      });
      return;
    }
    setPlacing(true);
    try {
      const lp = orderType === "limit" && limitPrice.trim() ? parseFloat(limitPrice.trim()) : undefined;
      const order = await placeOrder(sym, qtyRaw, side, orderType, "day", lp);
      toast({
        title: "Order placed",
        description: `${order.side.toUpperCase()} ${order.qty} ${order.symbol} · ${order.type} · ${order.status}`,
      });
      await loadPositionsAndOrders();
      await loadAccount();
    } catch (e) {
      toast({
        title: "Order failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Paper trading</CardTitle>
            <CardDescription>Test orders against your Alpaca paper account (dev proxy)</CardDescription>
          </CardHeader>
          <CardContent>
            {accountLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-48" />
              </div>
            )}
            {!accountLoading && accountError && (
              <Alert variant="destructive">
                <AlertTitle>Account</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>{accountError}</span>
                  <Button type="button" variant="outline" size="sm" onClick={loadAccount} className="shrink-0">
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!accountLoading && account && !accountError && (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="label-meta mb-1">Buying power</dt>
                  <dd className="text-lg font-medium tabular-nums">
                    {account.currency} {account.buying_power}
                  </dd>
                </div>
                <div>
                  <dt className="label-meta mb-1">Status</dt>
                  <dd className="text-lg font-medium">{account.status}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Price Chart */}
        {symbol.trim() && <StockChart symbol={symbol.trim().toUpperCase()} />}

        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Place order</CardTitle>
            <CardDescription>{orderType === "market" ? "Market order" : "Limit order"}, day time-in-force</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={side === "buy" ? "default" : "outline"}
                  onClick={() => setSide("buy")}
                  className={cn("min-h-11 touch-manipulation md:min-h-9", side === "buy" && "bg-success hover:bg-success/90")}
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={side === "sell" ? "destructive" : "outline"}
                  onClick={() => setSide("sell")}
                  className="min-h-11 touch-manipulation md:min-h-9"
                >
                  Sell
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 md:ml-auto">
                <Button
                  type="button"
                  size="sm"
                  variant={orderType === "market" ? "default" : "outline"}
                  onClick={() => setOrderType("market")}
                  className="min-h-11 touch-manipulation md:min-h-9"
                >
                  Market
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={orderType === "limit" ? "default" : "outline"}
                  onClick={() => setOrderType("limit")}
                  className="min-h-11 touch-manipulation md:min-h-9"
                >
                  Limit
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                orderType === "limit" ? "md:grid-cols-3" : "md:grid-cols-2",
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="pt-symbol">Symbol</Label>
                <Input
                  id="pt-symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-qty">Quantity</Label>
                <Input
                  id="pt-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={() => setQtyBlurred(true)}
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  inputMode="decimal"
                  className="tabular-nums"
                  aria-invalid={showQtyError}
                />
                {showQtyError && (
                  <p className="text-sm text-destructive animate-in fade-in duration-200">
                    Quantity must be greater than 0
                  </p>
                )}
              </div>
              {orderType === "limit" && (
                <div className="space-y-2">
                  <Label htmlFor="pt-limit">Limit Price ($)</Label>
                  <Input
                    id="pt-limit"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    inputMode="decimal"
                    placeholder="150.00"
                    className="tabular-nums font-mono"
                  />
                </div>
              )}
            </div>
            <Button
              type="button"
              className="min-h-11 w-full touch-manipulation md:min-h-10 md:w-auto"
              onClick={handlePlaceOrder}
              disabled={placing || !quantityValid}
            >
              {placing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing…
                </>
              ) : (
                `Place ${orderType} order`
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Positions</CardTitle>
            <CardDescription>Refreshes every {REFRESH_MS / 1000}s</CardDescription>
          </CardHeader>
          <CardContent>
            {positionsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Positions</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>{positionsError}</span>
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => void loadPositionsAndOrders()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!portfolioTablesReady && !positionsError && <PaperPositionsSkeleton />}
            {portfolioTablesReady && !positionsError && positions.length === 0 && (
              <p className="text-sm text-muted-foreground">No open positions.</p>
            )}
            {portfolioTablesReady && !positionsError && positions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg entry</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Unrealized P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((p) => {
                    const pl = parseFloat(p.unrealized_pl);
                    const neg = !Number.isNaN(pl) && pl < 0;
                    return (
                      <TableRow key={p.symbol}>
                        <TableCell className="font-mono font-medium">{p.symbol}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatUsd(p.avg_entry_price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatUsd(p.current_price)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums font-medium",
                            !Number.isNaN(pl) && (neg ? "text-destructive" : "text-success"),
                          )}
                        >
                          {formatUsd(p.unrealized_pl)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Recent orders</CardTitle>
            <CardDescription>Last 40 orders (all statuses)</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Orders</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>{ordersError}</span>
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => void loadPositionsAndOrders()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!portfolioTablesReady && !ordersError && <PaperOrdersSkeleton />}
            {portfolioTablesReady && !ordersError && orders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {portfolioTablesReady && !ordersError && orders.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Filled avg</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const cancellable = ['new', 'accepted', 'partially_filled', 'pending_new'].includes(o.status);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono font-medium">{o.symbol}</TableCell>
                        <TableCell>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded capitalize', o.side === 'buy' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400')}>
                            {o.side}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{o.qty}</TableCell>
                        <TableCell>
                          <span className={cn('text-xs', o.status === 'filled' && 'text-emerald-400', cancellable && 'text-yellow-400', o.status === 'canceled' && 'text-muted-foreground')}>
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {o.filled_avg_price != null ? formatUsd(o.filled_avg_price) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums text-sm">
                          {formatSubmitted(o.submitted_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cancellable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-11 text-xs text-red-400 hover:bg-red-400/10 hover:text-red-300 touch-manipulation md:h-7 md:min-h-7"
                              disabled={cancellingId === o.id}
                              onClick={async () => {
                                setCancellingId(o.id);
                                try {
                                  await cancelOrder(o.id);
                                  await loadPositionsAndOrders();
                                } catch { /* swallow */ }
                                finally { setCancellingId(null); }
                              }}
                            >
                              {cancellingId === o.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
