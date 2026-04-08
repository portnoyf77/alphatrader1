#!/bin/bash
set -e

echo "Installing Agent Activity components..."

echo "Writing src/components/dashboard/AgentActivityCard.tsx..."
cat << 'ENDOFFILE' > src/components/dashboard/AgentActivityCard.tsx
import { useEffect, useState } from 'react';
import { Bot, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import {
  getLatestRebalanceLog,
  formatRelativeTime,
  isAgentActive,
  tradeStats,
  RebalanceLogEntry,
} from '@/lib/rebalanceService';

interface AgentActivityCardProps {
  className?: string;
}

export function AgentActivityCard({ className }: AgentActivityCardProps) {
  const [latestLog, setLatestLog] = useState<RebalanceLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const fetchLatestLog = async () => {
      try {
        const log = await getLatestRebalanceLog();
        setLatestLog(log);
        setIsActive(isAgentActive(log?.timestamp || null));
        if (log) {
          setTimeAgo(formatRelativeTime(log.timestamp));
        }
      } catch (error) {
        console.error('Failed to fetch latest rebalance log:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestLog();
    const interval = setInterval(fetchLatestLog, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
          className
        )}
      >
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-28 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!latestLog) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
          'flex flex-col items-center justify-center text-center min-h-[180px]',
          className
        )}
      >
        <Bot className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-xs text-muted-foreground">No agent activity yet</p>
      </div>
    );
  }

  const { submitted, totalBuyValue, totalSellQty } = tradeStats(latestLog.trades);
  const buyCount = latestLog.trades.filter((t) => t.side === 'buy').length;
  const sellCount = latestLog.trades.filter((t) => t.side === 'sell').length;

  // Determine market outlook badge color
  const outlookBg =
    latestLog.overseerDecision.marketOutlook === 'bullish'
      ? 'bg-emerald-400/20 text-emerald-400'
      : latestLog.overseerDecision.marketOutlook === 'bearish'
        ? 'bg-red-400/20 text-red-400'
        : 'bg-yellow-400/20 text-yellow-400';

  // Confidence dots (1-10 scale)
  const confidenceLevel = latestLog.overseerDecision.confidence || 5;
  const filledDots = Math.ceil(confidenceLevel / 2); // 5 dots max, each represents 2 confidence points

  return (
    <div
      className={cn(
        'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
        className
      )}
    >
      {/* Header with status dot and title */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
          )}
        />
        <h3 className="text-xs font-semibold text-foreground">Agent Activity</h3>
      </div>

      {/* Time and badges */}
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground">{timeAgo}</div>

        {/* Market outlook and dry run badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', outlookBg)}>
            {latestLog.overseerDecision.marketOutlook.charAt(0).toUpperCase() +
              latestLog.overseerDecision.marketOutlook.slice(1)}
          </span>
          {latestLog.dryRun && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-400/20 text-blue-400">
              DRY RUN
            </span>
          )}
        </div>

        {/* Confidence dots */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                i < filledDots ? 'bg-emerald-400' : 'bg-white/20'
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {confidenceLevel}/10
          </span>
        </div>

        {/* Overseer reasoning (truncated) */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {latestLog.overseerDecision.reasoning}
        </p>

        {/* Trade summary */}
        <div className="flex items-center gap-3 pt-1 border-t border-white/10">
          {buyCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">{buyCount} buys</span>
            </div>
          )}
          {sellCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-red-400">{sellCount} sells</span>
            </div>
          )}
          {buyCount === 0 && sellCount === 0 && (
            <span className="text-xs text-muted-foreground">No trades</span>
          )}
        </div>
      </div>
    </div>
  );
}
ENDOFFILE

echo "Writing src/components/AgentActivityLog.tsx..."
cat << 'ENDOFFILE' > src/components/AgentActivityLog.tsx
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Bot, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getRebalanceLogs,
  formatRelativeTime,
  isAgentActive,
  tradeStats,
  RebalanceLogEntry,
} from '@/lib/rebalanceService';

interface AgentActivityLogProps {
  className?: string;
}

export function AgentActivityLog({ className }: AgentActivityLogProps) {
  const [logs, setLogs] = useState<RebalanceLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'fundamentals'>('overview');
  const [isAgentActiveNow, setIsAgentActiveNow] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const rebalanceLogs = await getRebalanceLogs(10);
        setLogs(rebalanceLogs);
        setIsAgentActiveNow(isAgentActive(rebalanceLogs[0]?.timestamp || null));
      } catch (error) {
        console.error('Failed to fetch rebalance logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-gray-500 rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">Agent Activity</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6',
          'flex flex-col items-center justify-center text-center',
          className
        )}
      >
        <Bot className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-foreground mb-1">No agent activity yet</p>
        <p className="text-xs text-muted-foreground">
          Agents run every 15 minutes during market hours.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isAgentActiveNow ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
          )}
        />
        <h2 className="text-sm font-semibold text-foreground">Agent Activity</h2>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {logs.map((log, index) => (
          <LogEntryCard
            key={index}
            log={log}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ))}
      </div>
    </div>
  );
}

interface LogEntryCardProps {
  log: RebalanceLogEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  activeTab: 'overview' | 'news' | 'fundamentals';
  onTabChange: (tab: 'overview' | 'news' | 'fundamentals') => void;
}

function LogEntryCard({
  log,
  isExpanded,
  onToggle,
  activeTab,
  onTabChange,
}: LogEntryCardProps) {
  const { submitted, failed, skipped, totalBuyValue, totalSellQty } = tradeStats(log.trades);
  const timeAgo = formatRelativeTime(log.timestamp);

  // Determine action type badge
  const action = log.overseerDecision.action;
  const actionLabel =
    action === 'buy_heavy'
      ? 'AGGRESSIVE'
      : action === 'sell_heavy'
        ? 'DEFENSIVE'
        : action === 'hold'
          ? 'HOLD'
          : 'REBALANCE';

  const actionColor =
    action === 'buy_heavy'
      ? 'bg-emerald-400/20 text-emerald-400'
      : action === 'sell_heavy'
        ? 'bg-red-400/20 text-red-400'
        : 'bg-yellow-400/20 text-yellow-400';

  // Market outlook badge
  const outlookColor =
    log.overseerDecision.marketOutlook === 'bullish'
      ? 'bg-emerald-400/20 text-emerald-400'
      : log.overseerDecision.marketOutlook === 'bearish'
        ? 'bg-red-400/20 text-red-400'
        : 'bg-yellow-400/20 text-yellow-400';

  // Confidence dots
  const confidenceLevel = log.overseerDecision.confidence || 5;
  const filledDots = Math.ceil(confidenceLevel / 2);

  const buyCount = log.trades.filter((t) => t.side === 'buy').length;
  const sellCount = log.trades.filter((t) => t.side === 'sell').length;
  const tradeCount = buyCount + sellCount;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header / Collapsed view */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{timeAgo}</div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', actionColor)}>
                {actionLabel}
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', outlookColor)}>
                {log.overseerDecision.marketOutlook.charAt(0).toUpperCase() +
                  log.overseerDecision.marketOutlook.slice(1)}
              </span>
              {tradeCount > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-foreground">
                  {tradeCount} trades
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confidence dots on the right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 h-1 rounded-full',
                i < filledDots ? 'bg-emerald-400' : 'bg-white/20'
              )}
            />
          ))}
        </div>
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Dry run badge if applicable */}
          {log.dryRun && (
            <div className="flex items-center gap-2 p-2 rounded bg-blue-400/20 border border-blue-400/30">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-400">
                This was a dry run (no trades executed)
              </span>
            </div>
          )}

          {/* Overseer reasoning and assessment */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground">Overseer Decision</div>
            <p className="text-xs text-muted-foreground">{log.overseerDecision.reasoning}</p>
            <p className="text-xs text-muted-foreground">
              <strong>Market Outlook:</strong> {log.overseerDecision.marketOutloak}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Portfolio Assessment:</strong> {log.overseerDecision.portfolioAssessment}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            {['overview', 'news', 'fundamentals'].map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab as 'overview' | 'news' | 'fundamentals')}
                className={cn(
                  'px-2 py-1.5 text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-emerald-400 text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Trades */}
              {log.trades.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">Trades</div>
                  {log.trades.map((trade, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-white/5 border border-white/10 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trade.side === 'buy' ? (
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {trade.symbol}
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs font-medium',
                              trade.side === 'buy'
                                ? 'bg-emerald-400/20 text-emerald-400'
                                : 'bg-red-400/20 text-red-400'
                            )}
                          >
                            {trade.side.toUpperCase()}
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs',
                              trade.status === 'submitted'
                                ? 'bg-emerald-400/20 text-emerald-400'
                                : trade.status === 'failed'
                                  ? 'bg-red-400/20 text-red-400'
                                  : trade.status === 'skipped'
                                    ? 'bg-yellow-400/20 text-yellow-400'
                                    : 'bg-blue-400/20 text-blue-400'
                            )}
                          >
                            {trade.status}
                          </span>
                        </div>
                        {trade.notional && (
                          <span className="text-xs font-semibold text-foreground">
                            {formatCurrency(trade.notional)}
                          </span>
                        )}
                      </div>
                      {trade.reasoning && (
                        <p className="text-xs text-muted-foreground">{trade.reasoning}</p>
                      )}
                      {trade.error && (
                        <p className="text-xs text-red-400">{trade.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No trades in this cycle</p>
              )}

              {/* Account snapshot */}
              {log.accountSnapshot && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-foreground">Account Before</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Equity:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {formatCurrency(log.accountSnapshot.equityBefore)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cash:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {formatCurrency(log.accountSnapshot.cashBefore)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Positions:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {log.accountSnapshot.positionCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cycle:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {(log.cycleDurationMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-2">
              {log.newsReport?.error ? (
                <p className="text-xs text-red-400">{log.newsReport.error}</p>
              ) : log.newsReport ? (
                <>
                  <div className="text-xs font-semibold text-foreground">
                    Market Sentiment: {log.newsReport.marketSentiment}
                  </div>
                  <p className="text-xs text-muted-foreground">{log.newsReport.marketSummary}</p>
                  {log.newsReport.urgentAlerts && log.newsReport.urgentAlerts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-red-400">Urgent Alerts:</div>
                      {log.newsReport.urgentAlerts.map((alert, idx) => (
                        <p key={idx} className="text-xs text-red-400">
                          • {alert}
                        </p>
                      ))}
                    </div>
                  )}
                  {log.newsReport.symbols && log.newsReport.symbols.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Relevant symbols: {log.newsReport.symbols.join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No news data available</p>
              )}
            </div>
          )}

          {activeTab === 'fundamentals' && (
            <div className="space-y-2">
              {log.fundamentalsReport?.error ? (
                <p className="text-xs text-red-400">{log.fundamentalsReport.error}</p>
              ) : log.fundamentalsReport ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {log.fundamentalsReport.overallAssessment}
                  </p>
                  {log.fundamentalsReport.symbols && log.fundamentalsReport.symbols.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Reviewed symbols: {log.fundamentalsReport.symbols.join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No fundamentals data available</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
ENDOFFILE

echo "Patching Dashboard.tsx..."
python3 << 'PYEOF'
import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add import for AgentActivityCard after lucide-react imports
# Find the line that has lucide-react import
if "import { AgentActivityCard } from '@/components/dashboard/AgentActivityCard';" not in content:
    # Find a good place to add the import (after existing component imports)
    import_pattern = r"(import \{[^}]*\} from 'lucide-react';)"
    match = re.search(import_pattern, content)
    if match:
        insert_pos = match.end()
        content = content[:insert_pos] + "\nimport { AgentActivityCard } from '@/components/dashboard/AgentActivityCard';" + content[insert_pos:]
    else:
        # Fallback: add after first import
        first_import_end = content.find('\n') + 1
        content = content[:first_import_end] + "import { AgentActivityCard } from '@/components/dashboard/AgentActivityCard';\n" + content[first_import_end:]

# Replace the placeholder content with AgentActivityCard component
# The placeholder is the inner div with "Rebalance recommendations and agent actions will appear here."
placeholder = '''<div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Rebalance recommendations and agent actions will appear here.
              </p>
              <p className="text-xs text-muted-foreground mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Coming soon
              </p>
            </div>'''

replacement = '<AgentActivityCard />'

if placeholder in content:
    content = content.replace(placeholder, replacement)
else:
    # Try a more flexible pattern match
    pattern = r'<div className="flex-1 flex flex-col items-center justify-center text-center">\s*<p className="text-sm text-muted-foreground">\s*Rebalance recommendations and agent actions will appear here\.\s*</p>\s*<p className="text-xs text-muted-foreground mt-2"[^>]*>\s*Coming soon\s*</p>\s*</div>'
    content = re.sub(pattern, '<AgentActivityCard />', content, flags=re.DOTALL)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

print('Dashboard.tsx patched')
PYEOF

echo "Patching Portfolio.tsx..."
python3 << 'PYEOF'
import re

with open('src/pages/Portfolio.tsx', 'r') as f:
    content = f.read()

# Add import for AgentActivityLog
if "import { AgentActivityLog } from '@/components/AgentActivityLog';" not in content:
    # Find the line that has component imports (after ui imports typically)
    import_pattern = r"(import \{[^}]*\} from '@/components/ui/[^']*';)"
    matches = list(re.finditer(import_pattern, content))
    if matches:
        insert_pos = matches[-1].end()
        content = content[:insert_pos] + "\nimport { AgentActivityLog } from '@/components/AgentActivityLog';" + content[insert_pos:]
    else:
        # Fallback: add after first import
        first_import_end = content.find('\n') + 1
        content = content[:first_import_end] + "import { AgentActivityLog } from '@/components/AgentActivityLog';\n" + content[first_import_end:]

# Insert AgentActivityLog after the summary cards grid
# Look for the closing </div> of the summary cards section (grid-cols-2 md:grid-cols-4 gap-4 mb-8)
summary_section_pattern = r'(className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"[^>]*>.*?</div>)'

match = re.search(summary_section_pattern, content, flags=re.DOTALL)
if match:
    insert_pos = match.end()
    # Insert the component with proper spacing
    insertion = '\n\n        {/* Agent Activity Log */}\n        <AgentActivityLog />'
    content = content[:insert_pos] + insertion + content[insert_pos:]
else:
    # Fallback: look for a comment marker if present
    if '{/* Equity Chart */}' in content:
        content = content.replace(
            '{/* Equity Chart */}',
            '{/* Agent Activity Log */}\n        <AgentActivityLog />\n\n        {/* Equity Chart */}'
        )

with open('src/pages/Portfolio.tsx', 'w') as f:
    f.write(content)

print('Portfolio.tsx patched')
PYEOF

echo "Done! Agent Activity components installed."
echo ""
echo "Summary:"
echo "  ✓ Created src/components/dashboard/AgentActivityCard.tsx"
echo "  ✓ Created src/components/AgentActivityLog.tsx"
echo "  ✓ Patched src/pages/Dashboard.tsx"
echo "  ✓ Patched src/pages/Portfolio.tsx"
