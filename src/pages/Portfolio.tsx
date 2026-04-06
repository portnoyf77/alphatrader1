import { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, RefreshCw, DollarSign, TrendingUp, Wallet, Clock, XCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/mockData';
import { useAlpacaAccount } from '@/hooks/useAlpacaAccount';
import { useAlpacaPositions } from '@/hooks/useAlpacaPositions';
import {
  getOrders,
  getPortfolioHistory,
  cancelOrder,
  closePosition,
  placeOrder,
  type AlpacaOrder,
  type AlpacaPortfolioHistoryPoint,
} from '@/lib/alpacaClient';

// ── Equity Chart (lightweight SVG) ──

function EquityChart({ data }: { data: AlpacaPortfolioHistoryPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Not enough data for chart yet. Place some trades and check back.
      </div>
    );
  }

  const values = data.map((d) => d.equity);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const width = 600;
  const height = 180;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (d.equity - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1].equity >= data[0].equity;
  const strokeColor = isPositive ? '#10B981' : '#EF4444';

  // Area fill
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
  const areaPath = `M${points[0]} ${points.slice(1).join(' ')} L${lastX},${height - padding} L${firstX},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
      <defs>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#equityGrad)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Y-axis labels */}
      <text x={padding} y={padding - 4} fill="#888" fontSize="10" textAnchor="start">
        {formatCurrency(maxVal)}
      </text>
      <text x={padding} y={height - padding + 14} fill="#888" fontSize="10" textAnchor="start">
        {formatCurrency(minVal)}
      </text>
    </svg>
  );
}

// ── Quick Trade Form ──

function QuickTrade({ onTradeComplete }: { onTradeComplete: () => void }) {
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState('1');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !qty) return;
    setStatus({ type: 'loading' });
    try {
      const order = await placeOrder(symbol, Number(qty), side);
      setStatus({ type: 'success', message: `${order.side.toUpperCase()} ${order.qty} ${order.symbol} - ${order.status}` });
      setSymbol('');
      setQty('1');
      setTimeout(() => {
        setStatus({ type: 'idle' });
        onTradeComplete();
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Order failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="AAPL"
          className="h-9 w-24 rounded-lg px-3 text-sm bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Qty</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="h-9 w-20 rounded-lg px-3 text-sm bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={cn(
            'h-9 px-3 rounded-lg text-sm font-medium transition-colors',
            side === 'buy' ? 'bg-emerald-600 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={cn(
            'h-9 px-3 rounded-lg text-sm font-medium transition-colors',
            side === 'sell' ? 'bg-red-600 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
          )}
        >
          Sell
        </button>
      </div>
      <Button type="submit" size="sm" disabled={status.type === 'loading' || !symbol.trim()}>
        {status.type === 'loading' ? 'Placing...' : 'Place Order'}
      </Button>
      {status.type === 'success' && <span className="text-xs text-emerald-400">{status.message}</span>}
      {status.type === 'error' && <span className="text-xs text-red-400">{status.message}</span>}
    </form>
  );
}

// ── Main Page ──

export default function Portfolio() {
  const { account, loading: acctLoading, refetch: refetchAccount } = useAlpacaAccount();
  const { positions, totalMarketValue, totalUnrealizedPL, loading: posLoading, refetch: refetchPositions } = useAlpacaPositions();
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [history, setHistory] = useState<AlpacaPortfolioHistoryPoint[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [historyPeriod, setHistoryPeriod] = useState('1M');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);

  const loading = acctLoading || posLoading;

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const o = await getOrders(100);
      setOrders(o);
    } catch {
      /* swallow */
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchHistory = async (period: string) => {
    try {
      const h = await getPortfolioHistory(period, period === '1D' ? '15Min' : '1D');
      setHistory(h);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchHistory(historyPeriod);
  }, [historyPeriod]);

  const handleRefresh = () => {
    refetchAccount();
    refetchPositions();
    fetchOrders();
    fetchHistory(historyPeriod);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await fetchOrders();
    } catch {
      /* swallow */
    } finally {
      setCancellingId(null);
    }
  };

  const handleClosePosition = async (symbol: string) => {
    setClosingSymbol(symbol);
    try {
      await closePosition(symbol);
      refetchPositions();
      refetchAccount();
      await fetchOrders();
    } catch {
      /* swallow */
    } finally {
      setClosingSymbol(null);
    }
  };

  const openOrders = useMemo(() => orders.filter((o) => ['new', 'accepted', 'partially_filled', 'pending_new'].includes(o.status)), [orders]);
  const recentFills = useMemo(() => orders.filter((o) => o.status === 'filled').slice(0, 20), [orders]);

  const totalCostBasis = positions.reduce((sum, p) => sum + p.avgEntryPrice * p.qty, 0);
  const totalPLPercent = totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
            <p className="text-muted-foreground">Real-time view of your Alpaca paper trading account.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Equity</span>
              </div>
              <div className="font-mono text-xl font-bold">
                {loading ? '...' : formatCurrency(account?.equity ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Unrealized P&L</span>
              </div>
              <div className={cn('font-mono text-xl font-bold', totalUnrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {loading ? '...' : `${totalUnrealizedPL >= 0 ? '+' : ''}${formatCurrency(totalUnrealizedPL)}`}
              </div>
              {!loading && totalPLPercent !== 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Cash</span>
              </div>
              <div className="font-mono text-xl font-bold">
                {loading ? '...' : formatCurrency(account?.cash ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Day P&L</span>
              </div>
              <div className={cn('font-mono text-xl font-bold', (account?.dayPL ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {loading ? '...' : `${(account?.dayPL ?? 0) >= 0 ? '+' : ''}${formatCurrency(account?.dayPL ?? 0)}`}
              </div>
              {!loading && account && account.dayPLPercent !== 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {account.dayPLPercent >= 0 ? '+' : ''}{account.dayPLPercent.toFixed(2)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Equity Chart */}
        <div
          className="mb-8 rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Equity History</h2>
            <div className="flex gap-1">
              {['1D', '1W', '1M', '3M', '6M', '1A'].map((p) => (
                <button
                  key={p}
                  onClick={() => setHistoryPeriod(p)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    historyPeriod === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <EquityChart data={history} />
        </div>

        {/* Quick Trade */}
        <div
          className="mb-8 rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-semibold mb-3">Quick Trade</h2>
          <QuickTrade onTradeComplete={handleRefresh} />
        </div>

        {/* Positions Table */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Open Positions
            {positions.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">({positions.length})</span>
            )}
          </h2>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No open positions. Place a trade to get started.
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg Entry</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">P&L %</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.symbol}>
                      <TableCell className="font-mono font-semibold">{pos.symbol}</TableCell>
                      <TableCell className="text-right font-mono">{pos.qty}</TableCell>
                      <TableCell className="text-right font-mono">${pos.avgEntryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">${pos.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(pos.marketValue)}</TableCell>
                      <TableCell className={cn('text-right font-mono', pos.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {pos.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPL)}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', pos.unrealizedPLPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {pos.unrealizedPLPercent >= 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          disabled={closingSymbol === pos.symbol}
                          onClick={() => handleClosePosition(pos.symbol)}
                        >
                          {closingSymbol === pos.symbol ? 'Closing...' : 'Close'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Open Orders */}
        {openOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Open Orders
              <span className="text-xs text-muted-foreground font-normal">({openOrders.length})</span>
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-semibold">{o.symbol}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', o.side === 'buy' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400')}>
                          {o.side.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{o.qty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.type} / {o.time_in_force}</TableCell>
                      <TableCell className="text-xs text-yellow-400">{o.status}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(o.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          disabled={cancellingId === o.id}
                          onClick={() => handleCancelOrder(o.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {cancellingId === o.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Recent Fills */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Recent Fills</h2>
          {ordersLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading order history...</div>
          ) : recentFills.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No filled orders yet.</div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Fill Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFills.map((o) => {
                    const fillPrice = parseFloat(o.filled_avg_price || '0');
                    const filledQty = parseFloat(o.filled_qty || '0');
                    const total = fillPrice * filledQty;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono font-semibold">{o.symbol}</TableCell>
                        <TableCell>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded', o.side === 'buy' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400')}>
                            {o.side.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{o.filled_qty}</TableCell>
                        <TableCell className="text-right font-mono">${fillPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(total)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(o.submitted_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
