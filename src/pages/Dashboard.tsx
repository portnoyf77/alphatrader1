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
