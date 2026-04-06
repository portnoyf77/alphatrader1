import { useCallback, useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getAccountInfo,
  getOrders,
  getPositions,
  placeOrder,
  type AlpacaAccountInfo,
  type AlpacaOrder,
  type AlpacaOrderSide,
  type AlpacaPosition,
} from "@/lib/alpacaClient";
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
  const [placing, setPlacing] = useState(false);

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
      const order = await placeOrder(sym, qtyRaw, side);
      toast({
        title: "Order placed",
        description: `${order.side.toUpperCase()} ${order.qty} ${order.symbol} · ${order.type} · ${order.status} · ID ${order.id}`,
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Place order</CardTitle>
            <CardDescription>Market order, day time-in-force</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={side === "buy" ? "default" : "outline"}
                onClick={() => setSide("buy")}
                className={cn(side === "buy" && "bg-success hover:bg-success/90")}
              >
                Buy
              </Button>
              <Button
                type="button"
                size="sm"
                variant={side === "sell" ? "destructive" : "outline"}
                onClick={() => setSide("sell")}
              >
                Sell
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                  inputMode="decimal"
                  className="tabular-nums"
                />
              </div>
            </div>
            <Button type="button" onClick={handlePlaceOrder} disabled={placing}>
              {placing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing…
                </>
              ) : (
                "Place order"
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
                <AlertDescription>{positionsError}</AlertDescription>
              </Alert>
            )}
            {!positionsError && positions.length === 0 && (
              <p className="text-sm text-muted-foreground">No open positions.</p>
            )}
            {positions.length > 0 && (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Recent orders</CardTitle>
            <CardDescription>Last 40 orders (all statuses)</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Orders</AlertTitle>
                <AlertDescription>{ordersError}</AlertDescription>
              </Alert>
            )}
            {!ordersError && orders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {orders.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Filled avg</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-medium">{o.symbol}</TableCell>
                      <TableCell className="capitalize">{o.side}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.qty}</TableCell>
                      <TableCell>{o.status}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {o.filled_avg_price != null ? formatUsd(o.filled_avg_price) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums text-sm">
                        {formatSubmitted(o.submitted_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
