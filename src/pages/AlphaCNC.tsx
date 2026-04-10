import React, { useEffect, useState, useCallback } from 'react';
import { Navbar as NavBar } from '@/components/layout/Navbar';
function formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ── Types ────────────────────────────────────────────────────────

interface AgentReport {
  timestamp: string;
  agentName: string;
  [key: string]: unknown;
}

interface OverseerDecision {
  action: string;
  reasoning: string;
  confidence: number;
  marketOutlook: string;
  alphaStrategy: string;
}

interface ProposedTrade {
  symbol: string;
  side: string;
  action: string;
  method: string;
  amount: number;
  reasoning: string;
  agentConsensus: string;
}

interface ExecutedTrade {
  symbol: string;
  side: string;
  status: string;
  reason?: string;
  reasoning: string;
}

interface WatchlistItem {
  symbol: string;
  reason: string;
  triggerCondition: string;
}

interface Benchmark {
  spyPrice: number;
  spyReturn1d: number;
  spyReturn5d: number;
  spyReturn20d: number;
  portfolioReturn1d: number;
  alpha1d: number;
}

interface AccountSnapshot {
  equityBefore: number;
  cashBefore: number;
  positionCount: number;
}

interface OverseerLog {
  timestamp: string;
  agentName: string;
  decision: OverseerDecision;
  proposedTrades: ProposedTrade[];
  executedTrades: ExecutedTrade[];
  portfolioAssessment: string;
  benchmarkStrategy: string;
  benchmark: Benchmark;
  watchlist: WatchlistItem[];
  nextCycleGuidance: string;
  accountSnapshot: AccountSnapshot;
}

// ── Agent metadata ───────────────────────────────────────────────

const AGENT_META: Record<string, { display: string; icon: string; description: string }> = {
  'news-sentinel': {
    display: 'News Sentinel',
    icon: '📡',
    description: '24/7 news monitoring across portfolio and market',
  },
  'sector-scanner': {
    display: 'Sector Scanner',
    icon: '🔄',
    description: 'Sector rotation, money flow, and relative strength',
  },
  'earnings-scout': {
    display: 'Earnings Scout',
    icon: '📊',
    description: 'Earnings calendar, surprises, and pre-earnings momentum',
  },
  'catalyst-tracker': {
    display: 'Catalyst Tracker',
    icon: '⚡',
    description: 'Economic events, insider trades, analyst activity',
  },
  'technical-analyst': {
    display: 'Technical Analyst',
    icon: '📈',
    description: 'Technical indicators, setups, and predictive signals',
  },
  'fundamentals-analyst': {
    display: 'Fundamentals Analyst',
    icon: '🔬',
    description: 'Valuation, profitability, and peer comparison',
  },
  'macro-analyst': {
    display: 'Macro Analyst',
    icon: '🌐',
    description: 'Macro regime, VIX, bonds, dollar, and breadth',
  },
};

const AGENT_ORDER = [
  'news-sentinel',
  'sector-scanner',
  'earnings-scout',
  'catalyst-tracker',
  'technical-analyst',
  'fundamentals-analyst',
  'macro-analyst',
];

// ── Helpers ──────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isRecent(ts: string, thresholdMs = 3600000): boolean {
  return Date.now() - new Date(ts).getTime() < thresholdMs;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── Extract key findings from each agent report ──────────────────

function extractFindings(agentName: string, report: AgentReport): string[] {
  const findings: string[] = [];
  if (!report) return ['No data available'];

  switch (agentName) {
    case 'news-sentinel': {
      const r = report as any;
      if (r.marketSentiment) findings.push(`Market sentiment: ${r.marketSentiment}`);
      if (r.sentimentShift) findings.push(`Trend: ${r.sentimentShift}`);
      if (r.urgentAlerts?.length) findings.push(`${r.urgentAlerts.length} urgent alert(s)`);
      if (r.newOpportunities?.length) findings.push(`${r.newOpportunities.length} new opportunity(s)`);
      if (r.symbolAnalyses?.length) {
        const actionable = r.symbolAnalyses.filter((s: any) => s.recommendation !== 'hold');
        if (actionable.length) findings.push(`${actionable.length} position(s) with action signals`);
      }
      break;
    }
    case 'sector-scanner': {
      const r = report as any;
      if (r.rotationPhase) findings.push(`Rotation phase: ${r.rotationPhase.replace(/_/g, ' ')}`);
      if (r.leadingSectors?.length) {
        findings.push(`Leading: ${r.leadingSectors.map((s: any) => s.name || s.sector).join(', ')}`);
      }
      if (r.sectorRecommendations?.overweight?.length) {
        findings.push(`Overweight: ${r.sectorRecommendations.overweight.join(', ')}`);
      }
      break;
    }
    case 'earnings-scout': {
      const r = report as any;
      if (r.upcomingEarningsCount) findings.push(`${r.upcomingEarningsCount} upcoming earnings`);
      if (r.heldPositionAlerts?.length) findings.push(`${r.heldPositionAlerts.length} held position alert(s)`);
      if (r.postEarningsOpportunities?.length) findings.push(`${r.postEarningsOpportunities.length} post-earnings opportunity(s)`);
      if (r.earningsSeasonThemes?.length) findings.push(`Theme: ${r.earningsSeasonThemes[0]}`);
      break;
    }
    case 'catalyst-tracker': {
      const r = report as any;
      if (r.actionableAlerts?.length) findings.push(`${r.actionableAlerts.length} actionable alert(s)`);
      if (r.insiderSignals?.newOpportunities?.length) {
        findings.push(`${r.insiderSignals.newOpportunities.length} insider signal(s)`);
      }
      if (r.economicOutlook?.keyUpcomingEvent) findings.push(`Next event: ${r.economicOutlook.keyUpcomingEvent}`);
      if (r.analystSignals?.summary) findings.push(r.analystSignals.summary);
      break;
    }
    case 'technical-analyst': {
      const r = report as any;
      if (r.marketTechnicals?.regime) findings.push(`Market regime: ${r.marketTechnicals.regime.replace(/_/g, ' ')}`);
      if (r.highConvictionCalls?.length) findings.push(`${r.highConvictionCalls.length} high-conviction call(s)`);
      if (r.symbolSignals?.length) {
        const buys = r.symbolSignals.filter((s: any) => s.signal?.includes('buy'));
        const sells = r.symbolSignals.filter((s: any) => s.signal?.includes('sell'));
        if (buys.length) findings.push(`${buys.length} buy signal(s)`);
        if (sells.length) findings.push(`${sells.length} sell signal(s)`);
      }
      break;
    }
    case 'fundamentals-analyst': {
      const r = report as any;
      if (r.valuationOpportunities?.length) findings.push(`${r.valuationOpportunities.length} valuation opportunity(s)`);
      if (r.symbolAnalyses?.length) {
        const strongBuys = r.symbolAnalyses.filter((s: any) => s.recommendation === 'strong_buy');
        if (strongBuys.length) findings.push(`${strongBuys.length} strong buy(s)`);
      }
      if (r.portfolioRisks?.length) findings.push(`${r.portfolioRisks.length} portfolio risk(s) flagged`);
      break;
    }
    case 'macro-analyst': {
      const r = report as any;
      if (r.regime) findings.push(`Regime: ${r.regime.replace(/_/g, ' ')}`);
      if (r.positioning?.equityExposure) findings.push(`Equity exposure: ${r.positioning.equityExposure}`);
      if (r.positioning?.sectorBias) findings.push(`Sector bias: ${r.positioning.sectorBias}`);
      if (r.risks?.length) findings.push(`${r.risks.length} risk(s) flagged`);
      break;
    }
  }

  return findings.length > 0 ? findings : ['Report available -- expand for details'];
}

// ── Extract detailed data for expanded view ──────────────────────

function extractDetails(agentName: string, report: AgentReport): React.ReactNode {
  if (!report) return <p className="text-gray-500 text-sm">No data available</p>;

  const r = report as any;

  switch (agentName) {
    case 'news-sentinel':
      return (
        <div className="space-y-3">
          {r.marketSummary && <p className="text-gray-300 text-sm">{r.marketSummary}</p>}
          {r.urgentAlerts?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-red-400 uppercase mb-1">Urgent Alerts</h5>
              {r.urgentAlerts.map((a: string, i: number) => (
                <p key={i} className="text-sm text-red-300 ml-2">- {a}</p>
              ))}
            </div>
          )}
          {r.symbolAnalyses?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Symbol Analysis</h5>
              {r.symbolAnalyses.map((s: any, i: number) => (
                <div key={i} className="ml-2 mb-2">
                  <span className="text-white font-medium">{s.symbol}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    s.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-300' :
                    s.sentiment === 'bearish' ? 'bg-red-500/20 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>{s.sentiment}</span>
                  <span className="ml-2 text-xs text-gray-400">Impact: {s.impactScore}/10</span>
                  <span className="ml-2 text-xs text-blue-400">{s.recommendation}</span>
                  {s.reasoning && <p className="text-xs text-gray-400 mt-0.5">{s.reasoning}</p>}
                </div>
              ))}
            </div>
          )}
          {r.sectorTrends && (
            <div className="flex gap-4 text-xs">
              {r.sectorTrends.positive?.length > 0 && (
                <span className="text-emerald-400">Positive sectors: {r.sectorTrends.positive.join(', ')}</span>
              )}
              {r.sectorTrends.negative?.length > 0 && (
                <span className="text-red-400">Negative sectors: {r.sectorTrends.negative.join(', ')}</span>
              )}
            </div>
          )}
        </div>
      );

    case 'sector-scanner':
      return (
        <div className="space-y-3">
          {r.summary && <p className="text-gray-300 text-sm">{r.summary}</p>}
          {r.leadingSectors?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-emerald-400 uppercase mb-1">Leading Sectors</h5>
              {r.leadingSectors.map((s: any, i: number) => (
                <p key={i} className="text-sm text-gray-300 ml-2">
                  <span className="text-white font-medium">{s.name || s.sector}</span>
                  {s.signal && <span className="text-xs text-gray-400 ml-2">{s.signal}</span>}
                </p>
              ))}
            </div>
          )}
          {r.rotationSignals?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Rotation Signals</h5>
              {r.rotationSignals.map((s: string, i: number) => (
                <p key={i} className="text-sm text-gray-300 ml-2">- {s}</p>
              ))}
            </div>
          )}
        </div>
      );

    case 'earnings-scout':
      return (
        <div className="space-y-3">
          {r.summary && <p className="text-gray-300 text-sm">{r.summary}</p>}
          {r.heldPositionAlerts?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-amber-400 uppercase mb-1">Held Position Alerts</h5>
              {r.heldPositionAlerts.map((a: any, i: number) => (
                <div key={i} className="ml-2 mb-2">
                  <span className="text-white font-medium">{a.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">Earnings: {a.earningsDate}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    a.recommendation?.includes('hold') ? 'bg-blue-500/20 text-blue-300' :
                    a.recommendation?.includes('add') ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>{a.recommendation}</span>
                  {a.reasoning && <p className="text-xs text-gray-400 mt-0.5">{a.reasoning}</p>}
                </div>
              ))}
            </div>
          )}
          {r.postEarningsOpportunities?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-blue-400 uppercase mb-1">Post-Earnings Opportunities</h5>
              {r.postEarningsOpportunities.map((o: any, i: number) => (
                <div key={i} className="ml-2 mb-1">
                  <span className="text-white font-medium">{o.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">{o.result} - {o.opportunity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'catalyst-tracker':
      return (
        <div className="space-y-3">
          {r.summary && <p className="text-gray-300 text-sm">{r.summary}</p>}
          {r.actionableAlerts?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-red-400 uppercase mb-1">Actionable Alerts</h5>
              {r.actionableAlerts.map((a: any, i: number) => (
                <div key={i} className="ml-2 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    a.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>{a.priority}</span>
                  <span className="text-sm text-gray-300 ml-2">{a.alert}</span>
                  {a.symbols?.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2">({a.symbols.join(', ')})</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {r.insiderSignals?.heldPositionSignals?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-purple-400 uppercase mb-1">Insider Signals</h5>
              {r.insiderSignals.heldPositionSignals.map((s: any, i: number) => (
                <div key={i} className="ml-2 mb-1">
                  <span className="text-white font-medium">{s.symbol}</span>
                  <span className={`ml-2 text-xs ${
                    s.netActivity === 'buying' ? 'text-emerald-400' :
                    s.netActivity === 'selling' ? 'text-red-400' : 'text-gray-400'
                  }`}>{s.netActivity}</span>
                  {s.detail && <span className="text-xs text-gray-400 ml-2">{s.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'technical-analyst':
      return (
        <div className="space-y-3">
          {r.marketTechnicals?.summary && <p className="text-gray-300 text-sm">{r.marketTechnicals.summary}</p>}
          {r.symbolSignals?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Signal Board</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {r.symbolSignals.map((s: any, i: number) => (
                  <div key={i} className="bg-gray-800/50 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{s.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        s.signal?.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' :
                        s.signal?.includes('sell') ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>{s.signal?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Rating: {s.technicalRating}/10 | Confidence: {s.confidence}/10
                    </div>
                    {s.primaryPattern && <p className="text-xs text-gray-500 mt-0.5">{s.primaryPattern}</p>}
                    {s.keyLevels && (
                      <div className="flex gap-3 text-xs mt-1">
                        <span className="text-emerald-400">Entry: ${s.keyLevels.entry}</span>
                        <span className="text-blue-400">Target: ${s.keyLevels.target}</span>
                        <span className="text-red-400">Stop: ${s.keyLevels.stop}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.highConvictionCalls?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-amber-400 uppercase mb-1">High Conviction Calls</h5>
              {r.highConvictionCalls.map((c: string, i: number) => (
                <p key={i} className="text-sm text-amber-300 ml-2">- {c}</p>
              ))}
            </div>
          )}
        </div>
      );

    case 'fundamentals-analyst':
      return (
        <div className="space-y-3">
          {r.overallAssessment && <p className="text-gray-300 text-sm">{r.overallAssessment}</p>}
          {r.symbolAnalyses?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Stock Analysis</h5>
              {r.symbolAnalyses.map((s: any, i: number) => (
                <div key={i} className="ml-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{s.symbol}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      s.recommendation?.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' :
                      s.recommendation?.includes('sell') || s.recommendation === 'reduce' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>{s.recommendation?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">Score: {s.fundamentalScore}/10</span>
                  </div>
                  {s.valuationDetail && <p className="text-xs text-gray-400 ml-0 mt-0.5">{s.valuationDetail}</p>}
                  {s.reasoning && <p className="text-xs text-gray-500 mt-0.5">{s.reasoning}</p>}
                </div>
              ))}
            </div>
          )}
          {r.valuationOpportunities?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-emerald-400 uppercase mb-1">Valuation Opportunities</h5>
              {r.valuationOpportunities.map((v: string, i: number) => (
                <p key={i} className="text-sm text-emerald-300 ml-2">- {v}</p>
              ))}
            </div>
          )}
        </div>
      );

    case 'macro-analyst':
      return (
        <div className="space-y-3">
          {r.summary && <p className="text-gray-300 text-sm">{r.summary}</p>}
          {r.signals && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Signal Dashboard</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(r.signals).map(([key, val]) => (
                  <div key={key} className="flex justify-between bg-gray-800/50 rounded px-2 py-1">
                    <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={
                      String(val).includes('bullish') || String(val).includes('loose') || String(val).includes('healthy') ? 'text-emerald-400' :
                      String(val).includes('bearish') || String(val).includes('stress') || String(val).includes('weak') ? 'text-red-400' :
                      'text-gray-300'
                    }>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.positioning && (
            <div>
              <h5 className="text-xs font-semibold text-blue-400 uppercase mb-1">Positioning</h5>
              <p className="text-sm text-gray-300 ml-2">
                Equity: <span className="text-white">{r.positioning.equityExposure}</span>
                {' | '}
                Bias: <span className="text-white">{r.positioning.sectorBias}</span>
              </p>
              {r.positioning.rationale && <p className="text-xs text-gray-400 ml-2 mt-0.5">{r.positioning.rationale}</p>}
            </div>
          )}
          {r.risks?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-red-400 uppercase mb-1">Risks</h5>
              {r.risks.map((risk: string, i: number) => (
                <p key={i} className="text-sm text-red-300 ml-2">- {risk}</p>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-xs text-gray-400 overflow-auto max-h-60">{JSON.stringify(report, null, 2)}</pre>;
  }
}

// ── Components ───────────────────────────────────────────────────

function AgentCard({
  agentName,
  report,
}: {
  agentName: string;
  report: AgentReport | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[agentName] || { display: agentName, icon: '🤖', description: '' };
  const findings = report ? extractFindings(agentName, report) : ['Awaiting first report...'];
  const active = report?.timestamp ? isRecent(report.timestamp) : false;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 focus:outline-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{meta.display}</h3>
              <p className="text-xs text-gray-500">{meta.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : report ? 'bg-gray-600' : 'bg-gray-800'}`} />
            <span className="text-xs text-gray-500">
              {report?.timestamp ? timeAgo(report.timestamp) : 'never'}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          {findings.map((f, i) => (
            <p key={i} className="text-sm text-gray-400">
              <span className="text-gray-600 mr-1.5">-</span>
              {f}
            </p>
          ))}
        </div>
      </button>

      {expanded && report && (
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          {extractDetails(agentName, report)}
          <p className="text-xs text-gray-600 mt-3">
            Last updated: {report.timestamp ? formatTimestamp(report.timestamp) : 'unknown'}
          </p>
        </div>
      )}
    </div>
  );
}

function ChiefAnalystCard({ log }: { log: OverseerLog | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!log) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/30 rounded-lg p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎖️</span>
          <div>
            <h3 className="text-lg font-bold text-amber-200">Chief Analyst</h3>
            <p className="text-sm text-gray-400">Autonomous decision-maker. Reads all 7 agents, decides trades.</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Awaiting first decision cycle...</p>
      </div>
    );
  }

  const d = log.decision;
  const actionColors: Record<string, string> = {
    aggressive_rebalance: 'bg-red-500/20 text-red-300 border-red-500/30',
    tactical_shift: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    hold: 'bg-gray-700/50 text-gray-300 border-gray-600',
    defensive_pivot: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    full_rotation: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };
  const outlookColors: Record<string, string> = {
    bullish: 'text-emerald-400',
    bearish: 'text-red-400',
    neutral: 'text-gray-400',
    uncertain: 'text-amber-400',
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎖️</span>
            <div>
              <h3 className="text-lg font-bold text-amber-200">Chief Analyst</h3>
              <p className="text-xs text-gray-500">Autonomous decision-maker. Reads all 7 agents, decides trades.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRecent(log.timestamp) ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-500">{timeAgo(log.timestamp)}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Decision summary */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-medium px-2 py-1 rounded border ${actionColors[d?.action] || actionColors.hold}`}>
              {d?.action?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
            </span>
            <span className={`text-sm font-medium ${outlookColors[d?.marketOutlook] || 'text-gray-400'}`}>
              {d?.marketOutlook ? `${d.marketOutlook.charAt(0).toUpperCase() + d.marketOutlook.slice(1)} outlook` : ''}
            </span>
            {d?.confidence && (
              <span className="text-xs text-gray-500">Confidence: {d.confidence}/10</span>
            )}
          </div>
          {d?.reasoning && <p className="text-sm text-gray-300">{d.reasoning}</p>}
        </div>

        {/* Trade summary */}
        {log.executedTrades?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {log.executedTrades.map((t, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                t.side === 'buy' ? 'bg-emerald-500/20 text-emerald-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {t.side.toUpperCase()} {t.symbol}
                {t.status !== 'filled' && <span className="text-gray-500 ml-1">({t.status})</span>}
              </span>
            ))}
          </div>
        )}

        {/* Benchmark */}
        {log.benchmark && (
          <div className="mt-3 flex gap-4 text-xs">
            <span className="text-gray-400">
              SPY: <span className={log.benchmark.spyReturn1d >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {log.benchmark.spyReturn1d >= 0 ? '+' : ''}{log.benchmark.spyReturn1d?.toFixed(2)}%
              </span>
            </span>
            <span className="text-gray-400">
              Portfolio: <span className={log.benchmark.portfolioReturn1d >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {log.benchmark.portfolioReturn1d >= 0 ? '+' : ''}{log.benchmark.portfolioReturn1d?.toFixed(2)}%
              </span>
            </span>
            <span className="text-gray-400">
              Alpha: <span className={log.benchmark.alpha1d >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {log.benchmark.alpha1d >= 0 ? '+' : ''}{log.benchmark.alpha1d?.toFixed(2)}%
              </span>
            </span>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-amber-500/20 p-5 bg-gray-950/50 space-y-4">
          {/* Strategy */}
          {d?.alphaStrategy && (
            <div>
              <h5 className="text-xs font-semibold text-amber-400 uppercase mb-1">Alpha Strategy</h5>
              <p className="text-sm text-gray-300">{d.alphaStrategy}</p>
            </div>
          )}

          {/* Proposed vs Executed */}
          {log.proposedTrades?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Trade Decisions</h5>
              <div className="space-y-2">
                {log.proposedTrades.map((t, i) => {
                  const executed = log.executedTrades?.find(e => e.symbol === t.symbol);
                  return (
                    <div key={i} className="bg-gray-800/50 rounded p-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          t.side === 'buy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>{t.side.toUpperCase()}</span>
                        <span className="text-white font-medium">{t.symbol}</span>
                        <span className="text-xs text-gray-400">{t.action}</span>
                        <span className="text-xs text-gray-500">${t.amount?.toFixed?.(2) ?? t.amount}</span>
                        {executed && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            executed.status === 'filled' ? 'bg-emerald-500/20 text-emerald-300' :
                            executed.status === 'blocked' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>{executed.status}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t.reasoning}</p>
                      {t.agentConsensus && (
                        <p className="text-xs text-blue-400 mt-0.5">Consensus: {t.agentConsensus}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Watchlist */}
          {log.watchlist?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-purple-400 uppercase mb-1">Watchlist</h5>
              {log.watchlist.map((w, i) => (
                <div key={i} className="ml-2 mb-1">
                  <span className="text-white font-medium">{w.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">{w.reason}</span>
                  {w.triggerCondition && (
                    <span className="text-xs text-purple-300 ml-2">Trigger: {w.triggerCondition}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Portfolio Assessment */}
          {log.portfolioAssessment && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Portfolio Assessment</h5>
              <p className="text-sm text-gray-300">{log.portfolioAssessment}</p>
            </div>
          )}

          {/* Next Cycle */}
          {log.nextCycleGuidance && (
            <div>
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Next Cycle Guidance</h5>
              <p className="text-sm text-gray-400">{log.nextCycleGuidance}</p>
            </div>
          )}

          {/* Account */}
          {log.accountSnapshot && (
            <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-800">
              <span>Equity: {formatCurrency(log.accountSnapshot.equityBefore)}</span>
              <span>Cash: {formatCurrency(log.accountSnapshot.cashBefore)}</span>
              <span>Positions: {log.accountSnapshot.positionCount}</span>
            </div>
          )}

          <p className="text-xs text-gray-600">
            Decision time: {formatTimestamp(log.timestamp)}
          </p>
        </div>
      )}
    </div>
  );
}

function OverseerHistoryFeed({ logs }: { logs: OverseerLog[] }) {
  const [filter, setFilter] = useState<'all' | 'trades' | 'holds'>('all');

  const filtered = logs.filter(log => {
    if (filter === 'trades') return log.executedTrades?.length > 0;
    if (filter === 'holds') return log.decision?.action === 'hold';
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Decision History</h2>
        <div className="flex gap-1">
          {(['all', 'trades', 'holds'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded ${
                filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No decisions yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((log, i) => {
            const d = log.decision;
            return (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      d?.action === 'hold' ? 'border-gray-600 text-gray-400' :
                      d?.action === 'aggressive_rebalance' ? 'border-red-500/30 text-red-300' :
                      d?.action === 'defensive_pivot' ? 'border-amber-500/30 text-amber-300' :
                      'border-blue-500/30 text-blue-300'
                    }`}>
                      {d?.action?.replace(/_/g, ' ') || 'unknown'}
                    </span>
                    {d?.confidence && (
                      <span className="text-xs text-gray-600">{d.confidence}/10</span>
                    )}
                  </div>
                  {log.benchmark && (
                    <span className={`text-xs ${log.benchmark.alpha1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Alpha: {log.benchmark.alpha1d >= 0 ? '+' : ''}{log.benchmark.alpha1d?.toFixed(2)}%
                    </span>
                  )}
                </div>
                {d?.reasoning && <p className="text-sm text-gray-400">{d.reasoning}</p>}
                {log.executedTrades?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {log.executedTrades.map((t, j) => (
                      <span key={j} className={`text-xs px-2 py-0.5 rounded ${
                        t.side === 'buy' ? 'bg-emerald-500/15 text-emerald-300' :
                        'bg-red-500/15 text-red-300'
                      }`}>
                        {t.side} {t.symbol}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function AlphaCNC() {
  const [agentIntel, setAgentIntel] = useState<Record<string, AgentReport | null>>({});
  const [overseerLogs, setOverseerLogs] = useState<OverseerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [intelRes, logsRes] = await Promise.all([
        fetch('/api/rebalance-log?type=intel'),
        fetch('/api/rebalance-log?count=50'),
      ]);

      if (intelRes.ok) {
        const data = await intelRes.json();
        const raw = data.agents || {};
        const parsed = {};
        for (const [k, v] of Object.entries(raw)) {
          if (v && typeof v === 'object' && 'value' in v) {
            try { parsed[k] = typeof v.value === 'string' ? JSON.parse(v.value) : v.value; }
            catch { parsed[k] = v; }
          } else { parsed[k] = v; }
        }
        setAgentIntel(parsed);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setOverseerLogs(data.logs || []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch CNC data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const latestOverseer = overseerLogs[0] || null;

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Alpha CNC</h1>
            <p className="text-sm text-gray-500 mt-1">Command and Control - Agent Intelligence Center</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Chief Analyst (Overseer) - Featured */}
        <div className="mb-8">
          <ChiefAnalystCard log={latestOverseer} />
        </div>

        {/* Intelligence Agents Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Intelligence Agents</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-800 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-1" />
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENT_ORDER.map(name => (
                <AgentCard
                  key={name}
                  agentName={name}
                  report={agentIntel[name] || null}
                />
              ))}
            </div>
          )}
        </div>

        {/* Decision History */}
        <OverseerHistoryFeed logs={overseerLogs} />
      </main>
    </div>
  );
}
