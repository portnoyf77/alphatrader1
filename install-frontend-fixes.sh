#!/bin/bash
set -e

echo "Installing frontend fixes..."

# Create directory if it doesn't exist
echo "Creating src/components/ui/ directory..."
mkdir -p "src/components/ui"

# File 1: src/components/MetricCard.tsx
echo "Writing src/components/MetricCard.tsx..."
cat << 'ENDOFFILE' > src/components/MetricCard.tsx
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value?: string;
  change?: string;
  positive?: boolean;
  loading?: boolean;
  subtitle?: string;
}

export function MetricCard({
  label,
  value,
  change,
  positive,
  loading = false,
  subtitle,
}: MetricCardProps) {
  if (loading || !value) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>
        <div className="h-8 bg-gray-700 rounded animate-pulse w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>

      {change && (
        <p className={cn(
          'text-sm font-medium',
          positive === true ? 'text-green-400' :
          positive === false ? 'text-red-400' : 'text-gray-400'
        )}>
          {change}
        </p>
      )}

      {subtitle && <p className="text-xs text-gray-500 mt-3">{subtitle}</p>}
    </div>
  );
}
ENDOFFILE

# File 2: src/pages/Dashboard.tsx
echo "Writing src/pages/Dashboard.tsx..."
cat << 'ENDOFFILE' > src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccountSummary, type AccountSummary, type Position } from '@/lib/accountService';
import { getLatestRebalanceLog, type RebalanceLogEntry, formatRelativeTime, isAgentActive } from '@/lib/rebalanceService';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { NavBar } from '@/components/NavBar';
import { MetricCard } from '@/components/MetricCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebalanceLog, setRebalanceLog] = useState<RebalanceLogEntry | null>(null);
  const [triggering, setTriggering] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const accountData = await getAccountSummary();
      setData(accountData);
      setLoading(false);

      const latestLog = await getLatestRebalanceLog();
      setRebalanceLog(latestLog);
    } catch (err) {
      setError('Unable to load account data. Check your connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerRebalance = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/rebalance-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      setError('Failed to trigger rebalance.');
    } finally {
      setTriggering(false);
    }
  };

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const acct = data?.account;
  const positions = data?.positions ?? [];

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Account Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Equity"
            value={loading ? undefined : formatCurrency(acct?.equity ?? 0)}
            loading={loading}
          />
          <MetricCard
            label="Day Change"
            value={loading ? undefined : formatCurrency(acct?.dayChangeAmt ?? 0)}
            change={loading ? undefined : formatPercent((acct?.dayChangePct ?? 0) / 100)}
            positive={(acct?.dayChangeAmt ?? 0) >= 0}
            loading={loading}
          />
          <MetricCard
            label="Cash Available"
            value={loading ? undefined : formatCurrency(acct?.cash ?? 0)}
            loading={loading}
          />
          <MetricCard
            label="Buying Power"
            value={loading ? undefined : formatCurrency(acct?.buyingPower ?? 0)}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/invest')}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
          >
            Create Portfolio
          </button>
          <button
            onClick={handleTriggerRebalance}
            disabled={triggering}
            className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {triggering ? 'Triggering...' : 'Trigger Rebalance'}
          </button>
        </div>

        {/* Positions Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          {/* Agent Status Bar */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  rebalanceLog && isAgentActive(rebalanceLog.timestamp)
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-gray-600'
                )}
              />
              <span className="text-sm text-gray-300">
                {rebalanceLog && isAgentActive(rebalanceLog.timestamp)
                  ? `Agents active - last cycle ${formatRelativeTime(rebalanceLog.timestamp)}`
                  : 'Agents idle'}
              </span>
            </div>
            <button
              onClick={() => navigate('/portfolio-tracker')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View Activity
            </button>
          </div>

          {/* Positions Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Symbol</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Shares</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Avg Entry</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Current Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Market Value</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">P&L ($)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">P&L (%)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : positions.length > 0 ? (
                  positions.map((p: Position) => {
                    const textColor = p.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400';

                    return (
                      <tr key={p.symbol} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-semibold text-white">{p.symbol}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{p.qty.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{formatCurrency(p.avgEntry)}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{formatCurrency(p.currentPrice)}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{formatCurrency(p.marketValue)}</td>
                        <td className={cn('px-6 py-4 text-right font-medium', textColor)}>
                          {formatCurrency(p.unrealizedPL)}
                        </td>
                        <td className={cn('px-6 py-4 text-right font-medium', textColor)}>
                          {formatPercent(p.unrealizedPLPct / 100)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">{p.allocationPct}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      <p className="mb-4">No positions yet. Create your first AI portfolio.</p>
                      <button
                        onClick={() => navigate('/invest')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Go to Invest
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-800 rounded p-4 space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3" />
                </div>
              ))
            ) : positions.length > 0 ? (
              positions.map((p: Position) => {
                const textColor = p.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400';

                return (
                  <div key={p.symbol} className="bg-gray-800 rounded p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-semibold text-white">{p.symbol}</p>
                        <p className="text-sm text-gray-400">{p.qty.toFixed(2)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-lg font-semibold', textColor)}>
                          {formatCurrency(p.unrealizedPL)}
                        </p>
                        <p className={cn('text-sm', textColor)}>{formatPercent(p.unrealizedPLPct / 100)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{formatCurrency(p.currentPrice)}</span>
                      <span>{p.allocationPct}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-4">No positions yet. Create your first AI portfolio.</p>
                <button
                  onClick={() => navigate('/invest')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Go to Invest
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
ENDOFFILE

# File 3: src/pages/Portfolio.tsx
echo "Writing src/pages/Portfolio.tsx..."
cat << 'ENDOFFILE' > src/pages/Portfolio.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccountSummary, type AccountSummary, type Position } from '@/lib/accountService';
import { getRebalanceLogs, type RebalanceLogEntry, formatRelativeTime, isAgentActive, tradeStats } from '@/lib/rebalanceService';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { NavBar } from '@/components/NavBar';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function Portfolio() {
  const navigate = useNavigate();
  const [data, setData] = useState<AccountSummary | null>(null);
  const [logs, setLogs] = useState<RebalanceLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);
  const [expandedAgentTab, setExpandedAgentTab] = useState<'news' | 'fundamentals'>('news');

  const fetchData = async () => {
    try {
      const [accountData, rebalanceLogs] = await Promise.all([
        getAccountSummary(),
        getRebalanceLogs(10),
      ]);
      setData(accountData);
      setLogs(rebalanceLogs);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const acct = data.account;
  const positions = data.positions;
  const history = data.history ?? [];

  // Performance metrics
  const totalUnrealizedPL = data.totalUnrealizedPL;
  const isPositive = totalUnrealizedPL >= 0;

  const bestPosition = positions.reduce<Position | null>((best, p) => {
    if (!best || p.unrealizedPLPct > best.unrealizedPLPct) return p;
    return best;
  }, null);

  const worstPosition = positions.reduce<Position | null>((worst, p) => {
    if (!worst || p.unrealizedPLPct < worst.unrealizedPLPct) return p;
    return worst;
  }, null);

  // Chart data - simple SVG polyline from history
  const equities = history.map(h => h.equity);
  const minEquity = equities.length > 0 ? Math.min(...equities) : acct.equity;
  const maxEquity = equities.length > 0 ? Math.max(...equities) : acct.equity;
  const range = maxEquity - minEquity || 1;

  const chartWidth = 600;
  const chartHeight = 300;
  const padding = 40;

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1 || 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((h.equity - minEquity) / range) * (chartHeight - 2 * padding);
    return [x, y];
  });

  const polylinePoints = points.map(p => `${p[0]},${p[1]}`).join(' ');
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio Performance Section */}
        <div className="mb-8">
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Total Equity</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-white">{formatCurrency(acct.equity)}</p>
              <p className={cn('text-xl font-semibold', acct.dayChangeAmt >= 0 ? 'text-green-400' : 'text-red-400')}>
                {acct.dayChangeAmt >= 0 ? '+' : ''}{formatCurrency(acct.dayChangeAmt)} ({acct.dayChangePct >= 0 ? '+' : ''}{acct.dayChangePct.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Equity Chart */}
          {history.length > 1 && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = padding + (i * (chartHeight - 2 * padding)) / 4;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="#374151"
                      strokeDasharray="4"
                    />
                  );
                })}

                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />

                <text x={padding - 10} y={padding - 10} textAnchor="end" fill="#9ca3af" fontSize="12">
                  ${maxEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </text>
                <text
                  x={padding - 10}
                  y={chartHeight - padding + 15}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="12"
                >
                  ${minEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </text>
              </svg>
            </div>
          )}
        </div>

        {/* Holdings Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Holdings</h2>
          {positions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {positions.map((p: Position) => {
                const textColor = p.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400';

                return (
                  <div key={p.symbol} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-2xl font-bold text-white">{p.symbol}</p>
                        <p className="text-sm text-gray-400">{p.qty.toFixed(2)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-lg font-semibold', textColor)}>
                          {formatCurrency(p.unrealizedPL)}
                        </p>
                        <p className={cn('text-sm', textColor)}>{formatPercent(p.unrealizedPLPct / 100)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Price</span>
                        <span className="text-white font-medium">{formatCurrency(p.currentPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg Entry</span>
                        <span className="text-white font-medium">{formatCurrency(p.avgEntry)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Market Value</span>
                        <span className="text-white font-medium">{formatCurrency(p.marketValue)}</span>
                      </div>

                      {/* Allocation Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">Portfolio Allocation</span>
                          <span className="text-xs font-medium text-gray-300">{p.allocationPct}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(p.allocationPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-400">
              No positions yet.
            </div>
          )}
        </div>

        {/* Agent Activity Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                logs.length > 0 && isAgentActive(logs[0].timestamp) ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
              )}
            />
            <h2 className="text-xl font-bold text-white">Agent Activity</h2>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const isExpanded = expandedLogIdx === idx;
                const trades = log.trades || [];
                const decision = log.overseerDecision;
                const stats = tradeStats(trades);

                return (
                  <div key={log.timestamp + idx} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                    {/* Collapsed Header */}
                    <button
                      onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>

                        <div className="text-sm text-gray-400">{formatRelativeTime(log.timestamp)}</div>

                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-semibold',
                            decision.marketOutlook === 'bullish'
                              ? 'bg-green-900 text-green-300'
                              : decision.marketOutlook === 'bearish'
                                ? 'bg-red-900 text-red-300'
                                : 'bg-gray-700 text-gray-300'
                          )}
                        >
                          {decision.marketOutlook}
                        </span>

                        {/* Confidence bar (1-10 mapped to 10 dots) */}
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                i < decision.confidence ? 'bg-blue-500' : 'bg-gray-700'
                              )}
                            />
                          ))}
                        </div>

                        <span className="text-xs text-gray-400 ml-auto">
                          {trades.length} trade{trades.length !== 1 ? 's' : ''}
                          {stats.failed > 0 && ` (${stats.failed} failed)`}
                        </span>
                      </div>

                      <span className={cn(
                        'text-xs font-semibold ml-3',
                        decision.action === 'aggressive' ? 'text-red-400' :
                        decision.action === 'defensive' ? 'text-yellow-400' :
                        decision.action === 'hold' ? 'text-gray-400' : 'text-blue-400'
                      )}>
                        {decision.action.toUpperCase()}
                      </span>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-gray-800 space-y-6 bg-gray-800/30">
                        {/* Dry run badge */}
                        {log.dryRun && (
                          <div className="bg-yellow-900/30 border border-yellow-700 rounded px-3 py-2 text-xs text-yellow-300">
                            DRY RUN - No trades were executed
                          </div>
                        )}

                        {/* Overseer Decision */}
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-2">Overseer Decision</h3>
                          <p className="text-sm text-gray-400 mb-2">{decision.reasoning}</p>
                          <p className="text-xs text-gray-500">{decision.portfolioAssessment}</p>
                        </div>

                        {/* Trades */}
                        {trades.length > 0 ? (
                          <div>
                            <h3 className="text-sm font-semibold text-white mb-3">Trades</h3>
                            <div className="space-y-2">
                              {trades.map((trade, i) => (
                                <div key={i} className="bg-gray-900 rounded p-3 text-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{trade.symbol}</span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          'px-2 py-0.5 rounded text-xs font-semibold',
                                          trade.side === 'buy'
                                            ? 'bg-green-900 text-green-300'
                                            : 'bg-red-900 text-red-300'
                                        )}
                                      >
                                        {trade.side.toUpperCase()}
                                      </span>
                                      <span className={cn(
                                        'text-xs',
                                        trade.status === 'submitted' ? 'text-green-400' :
                                        trade.status === 'failed' ? 'text-red-400' :
                                        trade.status === 'dry_run' ? 'text-yellow-400' : 'text-gray-400'
                                      )}>
                                        {trade.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-gray-400 mb-1">
                                    {trade.notional ? formatCurrency(trade.notional) : `${trade.qty} shares`}
                                  </div>
                                  {trade.reasoning && <p className="text-gray-500 text-xs">{trade.reasoning}</p>}
                                  {trade.error && <p className="text-red-400 text-xs mt-1">{trade.error}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Holding steady - no trades this cycle</p>
                        )}

                        {/* Agent Reports (tabbed) */}
                        <div>
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => setExpandedAgentTab('news')}
                              className={cn(
                                'text-xs px-3 py-1.5 rounded font-medium transition',
                                expandedAgentTab === 'news'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                              )}
                            >
                              News Analyst
                            </button>
                            <button
                              onClick={() => setExpandedAgentTab('fundamentals')}
                              className={cn(
                                'text-xs px-3 py-1.5 rounded font-medium transition',
                                expandedAgentTab === 'fundamentals'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                              )}
                            >
                              Fundamentals Analyst
                            </button>
                          </div>

                          {expandedAgentTab === 'news' && log.newsReport && (
                            <div className="space-y-3">
                              {log.newsReport.error ? (
                                <p className="text-sm text-red-400">{log.newsReport.error}</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-400">Market Sentiment:</span>
                                    <span className={cn(
                                      'text-xs font-semibold px-2 py-0.5 rounded',
                                      log.newsReport.marketSentiment === 'bullish' ? 'bg-green-900 text-green-300' :
                                      log.newsReport.marketSentiment === 'bearish' ? 'bg-red-900 text-red-300' :
                                      'bg-gray-700 text-gray-300'
                                    )}>
                                      {log.newsReport.marketSentiment}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400">{log.newsReport.marketSummary}</p>
                                  {log.newsReport.symbols.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                      {log.newsReport.symbols.map((s) => (
                                        <div key={s.symbol} className="flex items-center justify-between text-xs bg-gray-900 rounded px-3 py-2">
                                          <span className="font-medium text-white">{s.symbol}</span>
                                          <span className={cn(
                                            s.sentiment === 'bullish' ? 'text-green-400' :
                                            s.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-400'
                                          )}>
                                            {s.sentiment} (impact: {s.impactScore}/10)
                                          </span>
                                          <span className="text-gray-500">{s.recommendation}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {expandedAgentTab === 'fundamentals' && log.fundamentalsReport && (
                            <div className="space-y-3">
                              {log.fundamentalsReport.error ? (
                                <p className="text-sm text-red-400">{log.fundamentalsReport.error}</p>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-400">{log.fundamentalsReport.overallAssessment}</p>
                                  {log.fundamentalsReport.symbols.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                      {log.fundamentalsReport.symbols.map((s) => (
                                        <div key={s.symbol} className="flex items-center justify-between text-xs bg-gray-900 rounded px-3 py-2">
                                          <span className="font-medium text-white">{s.symbol}</span>
                                          <span className={cn(
                                            s.technicalSignal === 'bullish' ? 'text-green-400' :
                                            s.technicalSignal === 'bearish' ? 'text-red-400' : 'text-gray-400'
                                          )}>
                                            {s.technicalSignal} {s.fundamentalScore !== null ? `(score: ${s.fundamentalScore}/10)` : ''}
                                          </span>
                                          <span className="text-gray-500">{s.recommendation}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Account Snapshot */}
                        <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-700">
                          <span>Equity: {formatCurrency(log.accountSnapshot.equityBefore)}</span>
                          <span>Cash: {formatCurrency(log.accountSnapshot.cashBefore)}</span>
                          <span>{log.accountSnapshot.positionCount} positions</span>
                          <span>Cycle: {(log.cycleDurationMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-400">
              <p>No agent activity yet. Agents run every 15 minutes during market hours (9:30 AM - 4:00 PM ET).</p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">Total Unrealized P&L</p>
            <p className={cn('text-lg font-semibold', isPositive ? 'text-green-400' : 'text-red-400')}>
              {formatCurrency(totalUnrealizedPL)}
            </p>
          </div>

          {bestPosition && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <p className="text-xs text-gray-400 mb-2">Best Position</p>
              <p className="text-lg font-semibold text-green-400">
                {bestPosition.symbol} {formatPercent(bestPosition.unrealizedPLPct / 100)}
              </p>
            </div>
          )}

          {worstPosition && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <p className="text-xs text-gray-400 mb-2">Worst Position</p>
              <p className="text-lg font-semibold text-red-400">
                {worstPosition.symbol} {formatPercent(worstPosition.unrealizedPLPct / 100)}
              </p>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">Positions</p>
            <p className="text-lg font-semibold text-white">{data.positionCount}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
ENDOFFILE

# File 4: src/components/ui/toaster.tsx
echo "Writing src/components/ui/toaster.tsx..."
cat << 'ENDOFFILE' > src/components/ui/toaster.tsx
/**
 * Minimal Toaster stub for shadcn/ui compatibility.
 * Replace with full shadcn/ui install when ready.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function toast(opts: Omit<Toast, 'id'>) {
  // No-op in stub -- would need global state for full implementation
  console.log('[toast]', opts.title, opts.description);
}

export function Toaster() {
  return null;
}
ENDOFFILE

# File 5: src/components/ui/sonner.tsx
echo "Writing src/components/ui/sonner.tsx..."
cat << 'ENDOFFILE' > src/components/ui/sonner.tsx
/**
 * Minimal Sonner stub for shadcn/ui compatibility.
 * Replace with full sonner install when ready.
 */
import React from 'react';

export function Toaster() {
  return null;
}
ENDOFFILE

# File 6: src/components/ui/tooltip.tsx
echo "Writing src/components/ui/tooltip.tsx..."
cat << 'ENDOFFILE' > src/components/ui/tooltip.tsx
/**
 * Minimal Tooltip stubs for shadcn/ui compatibility.
 * Replace with full shadcn/ui install when ready.
 */
import React from 'react';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  return <div {...props}>{children}</div>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return null;
}
ENDOFFILE

# Modify Invest.tsx - remove 'use client' and replace navigation
echo "Modifying src/pages/Invest.tsx..."
sed -i '1{/^use client/d;}' src/pages/Invest.tsx
sed -i "s|import { useRouter } from 'next/navigation';|import { useNavigate } from 'react-router-dom';|g" src/pages/Invest.tsx
sed -i "s|const router = useRouter();|const navigate = useNavigate();|g" src/pages/Invest.tsx
sed -i "s|router.push('/dashboard');|navigate('/dashboard');|g" src/pages/Invest.tsx

# Modify AssistantPanel.tsx - remove 'use client'
echo "Modifying src/components/ai-assistant/AssistantPanel.tsx..."
sed -i '1{/^use client/d;}' src/components/ai-assistant/AssistantPanel.tsx

echo "All frontend fixes installed!"
