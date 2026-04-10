/**
 * Vercel serverless function: AI portfolio generation.
 *
 * v3: Agent-driven stock discovery with no artificial position limits.
 *
 * Key changes from v2:
 * - No 5-8 holding cap. Position count driven by risk profile + account size.
 * - Agent intelligence is the PRIMARY source for stock discovery.
 *   Specific symbols from agent reports (insider clusters, technical setups,
 *   earnings plays, valuation opportunities) are extracted and presented as
 *   explicit candidates to the portfolio architect.
 * - Pre-fetched market quotes are reference prices, not a selection menu.
 *   The AI can pick ANY US-listed Alpaca stock.
 * - Risk-profile composition: conservative leans on dividends/bonds,
 *   aggressive goes almost entirely individual stocks.
 *
 * POST /api/generate-portfolio
 * Body: { profile: OnboardingProfile, refinements: PortfolioRefinements }
 * Returns: { holdings: GeneratedHolding[], strategy: StrategyMeta } | { error: string }
 */

import { getAllLatestIntelligence } from './agents/lib/kv.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

// ── Alpaca helpers ──────────────────────────────────────────────

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function alpacaTrading(path) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Pre-fetch all data in parallel ──────────────────────────────

async function fetchAccountSummary() {
  try {
    const a = await alpacaTrading('/v2/account');
    if (!a) return 'Account data unavailable.';
    return `Equity: $${parseFloat(a.equity).toFixed(2)}, Cash: $${parseFloat(a.cash).toFixed(2)}, Buying Power: $${parseFloat(a.buying_power).toFixed(2)}`;
  } catch { return 'Account data unavailable.'; }
}

async function fetchPositionsSummary() {
  try {
    const positions = await alpacaTrading('/v2/positions');
    if (!positions || positions.length === 0) return 'No current positions.';
    return positions.map(p =>
      `${p.symbol}: ${p.qty} shares @ $${parseFloat(p.avg_entry_price).toFixed(2)} (current: $${parseFloat(p.current_price).toFixed(2)}, P&L: ${((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(1)}%)`
    ).join('\n');
  } catch { return 'Position data unavailable.'; }
}

async function fetchMarketSnapshot() {
  // Reference prices for commonly traded securities.
  // This is NOT the selection universe -- the AI can pick any US-listed Alpaca stock.
  const symbols = [
    // ── Broad market & bond ETFs ──
    'SPY', 'QQQ', 'IWM', 'VTI', 'DIA',
    'BND', 'TLT', 'VCIT', 'HYG', 'AGG',
    // ── Sector ETFs ──
    'XLK', 'XLV', 'XLF', 'XLE', 'XLI', 'XLP', 'XLY', 'XLU', 'XLC', 'XLRE', 'XLB',
    // ── Commodity & alternative ──
    'GLD', 'SLV', 'GSG', 'VNQ', 'ICLN',
    // ── Dividend / income ──
    'SCHD', 'VIG', 'DVY', 'JEPI', 'O', 'ABBV', 'KO', 'PEP', 'PG', 'JNJ',
    // ── Mega cap tech ──
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'CRM',
    // ── Semiconductors ──
    'AMD', 'INTC', 'QCOM', 'MU', 'MRVL', 'AMAT', 'LRCX', 'KLAC', 'SOXX', 'SMH',
    // ── Financials ──
    'JPM', 'BAC', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK', 'C', 'WFC',
    // ── Healthcare & biotech ──
    'UNH', 'LLY', 'MRK', 'TMO', 'ABT', 'AMGN', 'GILD', 'ISRG', 'VRTX', 'BMY',
    // ── Energy ──
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY', 'MPC', 'PSX',
    // ── Consumer / retail ──
    'WMT', 'COST', 'HD', 'MCD', 'SBUX', 'NKE', 'TGT', 'LOW',
    // ── Industrials & defense ──
    'CAT', 'DE', 'GE', 'HON', 'LMT', 'RTX', 'UNP', 'BA',
    // ── AI / software / cloud ──
    'PLTR', 'SNOW', 'DDOG', 'NET', 'CRWD', 'PANW', 'ZS', 'NOW',
    // ── International exposure ──
    'VEA', 'VWO', 'EEM', 'INDA', 'EWJ', 'MCHI',
    // ── Growth / momentum ──
    'COIN', 'SQ', 'SHOP', 'ROKU', 'UBER', 'ABNB', 'DASH', 'RBLX',
  ].join(',');

  try {
    const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(symbols)}`);
    if (!data || !data.quotes) return 'Market data unavailable.';
    const lines = [];
    for (const [sym, q] of Object.entries(data.quotes)) {
      const mid = ((q.bp + q.ap) / 2).toFixed(2);
      lines.push(`${sym}: $${mid}`);
    }
    return lines.join(', ');
  } catch { return 'Market data unavailable.'; }
}

// ── Extract specific stock recommendations from agent intelligence ──

function extractAgentRecommendations(intelligence) {
  if (!intelligence) return { candidates: [], sectorSignals: [], macroContext: '' };

  const candidates = [];  // { symbol, source, signal, detail }
  const sectorSignals = [];
  let macroContext = '';

  // ── News Sentinel: new opportunities + symbol analyses ──
  const news = intelligence['news-sentinel'];
  if (news) {
    if (news.newOpportunities && Array.isArray(news.newOpportunities)) {
      for (const sym of news.newOpportunities) {
        if (typeof sym === 'string') {
          candidates.push({ symbol: sym, source: 'News Sentinel', signal: 'news-driven opportunity', detail: 'Flagged as new opportunity based on news flow' });
        }
      }
    }
    if (news.symbolAnalyses && Array.isArray(news.symbolAnalyses)) {
      for (const sa of news.symbolAnalyses) {
        if (sa.symbol && (sa.recommendation === 'increase' || sa.sentiment === 'bullish') && sa.impactScore >= 6) {
          candidates.push({ symbol: sa.symbol, source: 'News Sentinel', signal: `${sa.sentiment} (impact: ${sa.impactScore}/10)`, detail: sa.reasoning || sa.catalysts?.join(', ') || '' });
        }
      }
    }
  }

  // ── Catalyst Tracker: insider cluster buys + analyst upgrades ──
  const catalysts = intelligence['catalyst-tracker'];
  if (catalysts && catalysts.status !== 'skipped') {
    if (catalysts.insiderSignals?.newOpportunities) {
      for (const opp of catalysts.insiderSignals.newOpportunities) {
        if (opp.symbol) {
          candidates.push({ symbol: opp.symbol, source: 'Catalyst Tracker (Insider)', signal: 'cluster insider buying', detail: opp.cluster || opp.signal || '' });
        }
      }
    }
    if (catalysts.insiderSignals?.heldPositionSignals) {
      for (const sig of catalysts.insiderSignals.heldPositionSignals) {
        if (sig.symbol && sig.netActivity === 'buying' && sig.significance !== 'low') {
          candidates.push({ symbol: sig.symbol, source: 'Catalyst Tracker (Insider)', signal: `insider ${sig.netActivity} (${sig.significance})`, detail: sig.detail || '' });
        }
      }
    }
    if (catalysts.analystSignals?.heldPositionChanges) {
      for (const chg of catalysts.analystSignals.heldPositionChanges) {
        if (chg.symbol && chg.latestAction === 'upgrade') {
          candidates.push({ symbol: chg.symbol, source: 'Catalyst Tracker (Analyst)', signal: 'analyst upgrade', detail: chg.detail || '' });
        }
      }
    }
    if (catalysts.actionableAlerts) {
      for (const alert of catalysts.actionableAlerts) {
        if (alert.priority === 'high' && alert.symbols?.length) {
          for (const sym of alert.symbols) {
            if (!candidates.find(c => c.symbol === sym && c.source.includes('Catalyst'))) {
              candidates.push({ symbol: sym, source: 'Catalyst Tracker (Alert)', signal: 'high-priority alert', detail: alert.alert || '' });
            }
          }
        }
      }
    }
  }

  // ── Technical Analyst: symbol signals + high conviction calls ──
  const tech = intelligence['technical-analyst'];
  if (tech) {
    if (tech.symbolSignals && Array.isArray(tech.symbolSignals)) {
      for (const sig of tech.symbolSignals) {
        if (sig.symbol && (sig.signal === 'strong_buy' || sig.signal === 'buy') && sig.confidence >= 6) {
          candidates.push({
            symbol: sig.symbol,
            source: 'Technical Analyst',
            signal: `${sig.signal} (confidence: ${sig.confidence}/10)`,
            detail: `${sig.primaryPattern || ''}${sig.keyLevels ? ` | Entry: $${sig.keyLevels.entry}, Target: $${sig.keyLevels.target}, Stop: $${sig.keyLevels.stop}` : ''}`,
          });
        }
      }
    }
    if (tech.highConvictionCalls && Array.isArray(tech.highConvictionCalls)) {
      for (const call of tech.highConvictionCalls) {
        const match = typeof call === 'string' ? call.match(/^([A-Z]{1,5})\b/) : null;
        if (match && !candidates.find(c => c.symbol === match[1] && c.source === 'Technical Analyst')) {
          candidates.push({ symbol: match[1], source: 'Technical Analyst (High Conviction)', signal: 'high conviction', detail: call });
        }
      }
    }
  }

  // ── Earnings Scout: post-earnings opportunities + market movers ──
  const earnings = intelligence['earnings-scout'];
  if (earnings) {
    if (earnings.postEarningsOpportunities && Array.isArray(earnings.postEarningsOpportunities)) {
      for (const opp of earnings.postEarningsOpportunities) {
        if (opp.symbol && opp.opportunity && opp.opportunity !== 'none') {
          candidates.push({ symbol: opp.symbol, source: 'Earnings Scout', signal: `post-earnings ${opp.opportunity}`, detail: opp.reasoning || `${opp.result} earnings, market ${opp.marketReaction}` });
        }
      }
    }
    if (earnings.heldPositionAlerts && Array.isArray(earnings.heldPositionAlerts)) {
      for (const alert of earnings.heldPositionAlerts) {
        if (alert.symbol && alert.recommendation === 'add_before' && alert.confidence >= 6) {
          candidates.push({ symbol: alert.symbol, source: 'Earnings Scout', signal: `add before earnings (${alert.daysUntil}d away)`, detail: alert.reasoning || alert.historicalPattern || '' });
        }
      }
    }
    if (earnings.marketMovers && Array.isArray(earnings.marketMovers)) {
      for (const mover of earnings.marketMovers) {
        const match = typeof mover === 'string' ? mover.match(/^([A-Z]{1,5})\b/) : null;
        if (match && !candidates.find(c => c.symbol === match[1] && c.source.includes('Earnings'))) {
          candidates.push({ symbol: match[1], source: 'Earnings Scout (Market Mover)', signal: 'earnings catalyst', detail: mover });
        }
      }
    }
  }

  // ── Fundamentals Analyst: valuation opportunities ──
  const fundamentals = intelligence['fundamentals-analyst'];
  if (fundamentals) {
    if (fundamentals.symbolAnalyses && Array.isArray(fundamentals.symbolAnalyses)) {
      for (const sa of fundamentals.symbolAnalyses) {
        if (sa.symbol && (sa.recommendation === 'strong_buy' || sa.recommendation === 'buy') && sa.fundamentalScore >= 7) {
          candidates.push({
            symbol: sa.symbol,
            source: 'Fundamentals Analyst',
            signal: `${sa.recommendation} (score: ${sa.fundamentalScore}/10, ${sa.valuationAssessment})`,
            detail: sa.reasoning || sa.keyStrengths?.join(', ') || '',
          });
        }
      }
    }
    if (fundamentals.valuationOpportunities && Array.isArray(fundamentals.valuationOpportunities)) {
      for (const opp of fundamentals.valuationOpportunities) {
        const match = typeof opp === 'string' ? opp.match(/^([A-Z]{1,5})\b/) : null;
        if (match && !candidates.find(c => c.symbol === match[1] && c.source.includes('Fundamentals'))) {
          candidates.push({ symbol: match[1], source: 'Fundamentals Analyst (Valuation)', signal: 'valuation opportunity', detail: opp });
        }
      }
    }
  }

  // ── Sector Scanner: sector-level signals (no individual stocks) ──
  const sectors = intelligence['sector-scanner'];
  if (sectors) {
    if (sectors.sectorRecommendations) {
      if (sectors.sectorRecommendations.overweight) {
        sectorSignals.push(`OVERWEIGHT: ${sectors.sectorRecommendations.overweight.join(', ')}`);
      }
      if (sectors.sectorRecommendations.underweight) {
        sectorSignals.push(`UNDERWEIGHT: ${sectors.sectorRecommendations.underweight.join(', ')}`);
      }
    }
    if (sectors.rotationPhase) {
      sectorSignals.push(`Rotation phase: ${sectors.rotationPhase}`);
    }
    if (sectors.predictiveInsights && Array.isArray(sectors.predictiveInsights)) {
      for (const insight of sectors.predictiveInsights) {
        sectorSignals.push(insight);
      }
    }
  }

  // ── Macro Analyst: regime context (no individual stocks) ──
  const macro = intelligence['macro-analyst'];
  if (macro) {
    const parts = [];
    if (macro.regime) parts.push(`Regime: ${macro.regime} (confidence: ${macro.regimeConfidence || '?'}/10)`);
    if (macro.summary) parts.push(macro.summary);
    if (macro.positioning) {
      parts.push(`Equity exposure: ${macro.positioning.equityExposure}. Sector bias: ${macro.positioning.sectorBias}`);
      if (macro.positioning.rationale) parts.push(`Rationale: ${macro.positioning.rationale}`);
    }
    if (macro.predictiveOutlook) parts.push(`Outlook: ${macro.predictiveOutlook}`);
    if (macro.risks?.length) parts.push(`Key risks: ${macro.risks.join('; ')}`);
    macroContext = parts.join('\n');
  }

  // Deduplicate: merge same symbol from multiple agents
  const merged = {};
  for (const c of candidates) {
    if (!merged[c.symbol]) {
      merged[c.symbol] = { symbol: c.symbol, sources: [], signals: [], details: [] };
    }
    merged[c.symbol].sources.push(c.source);
    merged[c.symbol].signals.push(c.signal);
    if (c.detail) merged[c.symbol].details.push(c.detail);
  }

  // Sort by multi-agent consensus (most sources first)
  const sortedCandidates = Object.values(merged).sort((a, b) => b.sources.length - a.sources.length);

  return { candidates: sortedCandidates, sectorSignals, macroContext };
}

// ── Intelligence narrative builder (market context, not stock picks) ──

function buildIntelligenceNarrative(intelligence) {
  if (!intelligence) return 'Agent intelligence unavailable (KV not configured).';

  const sections = [];

  const news = intelligence['news-sentinel'];
  if (news) {
    sections.push(`MARKET SENTIMENT: ${news.marketSentiment || 'unknown'}${news.sentimentShift ? ` (${news.sentimentShift})` : ''}
${news.marketSummary || ''}
${news.urgentAlerts?.length ? `Urgent alerts: ${news.urgentAlerts.join('; ')}` : ''}
${news.sectorTrends ? `Positive sectors: ${news.sectorTrends.positive?.join(', ') || 'none'}. Negative: ${news.sectorTrends.negative?.join(', ') || 'none'}` : ''}`);
  }

  const earnings = intelligence['earnings-scout'];
  if (earnings) {
    sections.push(`EARNINGS LANDSCAPE: ${earnings.summary || 'No data'}
${earnings.earningsSeasonThemes?.length ? `Themes: ${earnings.earningsSeasonThemes.join('; ')}` : ''}`);
  }

  const catalysts = intelligence['catalyst-tracker'];
  if (catalysts && catalysts.status !== 'skipped') {
    const econ = catalysts.economicOutlook;
    sections.push(`UPCOMING CATALYSTS:
${catalysts.summary || ''}
${econ ? `Key event: ${econ.keyUpcomingEvent || 'none'} (${econ.expectedImpact || '?'} impact). Positioning: ${econ.positioningAdvice || 'N/A'}` : ''}`);
  }

  if (sections.length === 0) return 'No agent intelligence available yet. Agents may not have completed their first cycle.';

  return sections.join('\n\n');
}

// ── System prompt ──────────────────────────────────────────────

function buildPrompt(profile, refinements, account, positions, marketData, intelligence) {
  const riskTolerance = (profile.riskTolerance || 'Moderate').toLowerCase();

  // Extract structured recommendations from agents
  const { candidates, sectorSignals, macroContext } = extractAgentRecommendations(intelligence);
  const narrative = buildIntelligenceNarrative(intelligence);

  // Build the agent-recommended candidates section
  let candidatesSection;
  if (candidates.length > 0) {
    const lines = candidates.map(c => {
      const consensus = c.sources.length > 1 ? ` [MULTI-AGENT CONSENSUS: ${c.sources.length} agents]` : '';
      return `- ${c.symbol}${consensus}\n  Sources: ${c.sources.join(', ')}\n  Signals: ${c.signals.join('; ')}\n  ${c.details.length ? 'Details: ' + c.details[0] : ''}`;
    });
    candidatesSection = `The following stocks have been flagged by your AI agents as having actionable signals RIGHT NOW. Multi-agent consensus (same symbol flagged by 2+ agents) is especially strong. SERIOUSLY CONSIDER these for inclusion, weighted by signal strength and fit with the investor profile:\n\n${lines.join('\n\n')}`;
  } else {
    candidatesSection = 'No specific stock recommendations from agents at this time. Use your own analysis to select the best stocks for this portfolio based on current market conditions, the investor profile, and sector preferences.';
  }

  // Risk-based composition guidance
  let compositionGuidance;
  if (riskTolerance === 'conservative') {
    compositionGuidance = `PORTFOLIO COMPOSITION -- CONSERVATIVE:
- Target 10-20 positions depending on account size
- Core: Dividend aristocrats and blue-chip stocks for stable income -- pick whichever specific names have the best current signals, not a static list
- Bond ETFs for 15-30% of portfolio as ballast (BND, AGG, TLT)
- 1-2 broad market ETFs acceptable as core equity anchors
- Defensive sectors: utilities, healthcare, consumer staples
- Individual stock selection should favor low-beta, high-dividend names
- Avoid speculative growth, crypto-adjacent, or high-volatility plays
- Minimum position size: 3%
- If macro regime is risk-off, increase bond allocation`;
  } else if (riskTolerance === 'aggressive' || riskTolerance === 'very aggressive') {
    compositionGuidance = `PORTFOLIO COMPOSITION -- AGGRESSIVE:
- Target 20-35 positions to capture multiple alpha opportunities
- STRONGLY favor individual stocks over ETFs. ETFs dilute the edge your agent intelligence provides
- Only use ETFs for specific tactical purposes (e.g., GLD as inflation hedge, TLT as duration play)
- Concentrate in sectors where multiple agents show conviction
- Include growth stocks, momentum plays, pre-earnings positions, insider-buying signals
- Volatile names are fine when agents support the thesis
- Allow concentrated sector bets (up to 40% in a single sector) when intelligence is strong
- Minimum position size: 1%
- Maximum single position: 10%
- If macro regime is risk-off, shift to quality growth rather than going defensive`;
  } else {
    compositionGuidance = `PORTFOLIO COMPOSITION -- MODERATE:
- Target 15-25 positions for balanced diversification
- Primarily individual stocks (70-80% of portfolio) -- agent intelligence adds the most value here
- 2-4 ETFs acceptable for tactical purposes: broad equity anchor, sector tilt, or bond allocation
- Mix of growth and value stocks across sectors
- Follow sector rotation signals but maintain some cross-sector balance
- Include dividend payers alongside growth names
- Minimum position size: 2%
- Maximum single position: 8%
- If macro regime is risk-off, tilt toward quality and add some bond exposure`;
  }

  return `You are Alpha, the AI portfolio architect for Alpha Trader -- a paper trading platform powered by Alpaca. This is a standard investment account (not a retirement account, 401k, or IRA).

## Your task
Build a concrete portfolio allocation. The user has already reviewed your initial recommendation and refined their preferences. Now generate the actual holdings.

## Investor profile (from onboarding)
- Investment goal: ${profile.investmentGoal || 'Not specified'}
- Time horizon: ${profile.timeHorizon || 'Not specified'}
- Risk tolerance: ${profile.riskTolerance || 'Not specified'}
- Investment experience: ${profile.investmentExperience || 'Not specified'}
- Annual income range: ${profile.annualIncome || 'Not specified'}
- Net worth range: ${profile.netWorth || 'Not specified'}

## Portfolio specifications (user's refinement choices)
- Sector focus: ${refinements.sectors || 'No preference'}
- Volatility tolerance: ${refinements.volatility || 'Moderate'}
- Geographic exposure: ${refinements.geography || 'No preference'}${refinements.userFeedback ? `\n- Additional input: ${refinements.userFeedback}` : ''}

## Current account
${account}

## Current positions
${positions}

## MACRO ENVIRONMENT
${macroContext || 'Macro data not yet available.'}

## SECTOR ROTATION SIGNALS
${sectorSignals.length > 0 ? sectorSignals.join('\n') : 'Sector rotation data not yet available.'}

## MARKET NARRATIVE (from agent monitoring)
${narrative}

## AGENT-RECOMMENDED STOCK CANDIDATES
${candidatesSection}

## Reference prices (common securities -- NOT your selection universe)
These are live quotes for frequently traded securities. Use them as pricing context ONLY.
You are NOT limited to these symbols. Pick the BEST stocks for this portfolio from ANY US-listed security on Alpaca.
If you identify a strong candidate that is not in this list, include it anyway -- the execution system handles any valid Alpaca symbol.

${marketData}

## ${compositionGuidance}

## Stock selection philosophy

Your 8 AI agents monitor markets 24/7 and have surfaced specific stock recommendations above. But you are not limited to those picks either. Your job is to build the BEST portfolio by combining:

1. AGENT INTELLIGENCE (primary source): The candidates above have real-time signals -- insider buying, technical setups, earnings plays, valuation gaps. Multi-agent consensus (2+ agents flagging the same stock) is a particularly strong signal.
2. SECTOR ALIGNMENT: Match the user's sector preferences. If they chose "Technology," go deep into tech -- don't just buy XLK. Pick the specific tech stocks with the strongest agent signals or fundamentals.
3. MARKET AWARENESS: Use your knowledge of the current market landscape. If a sector is hot and agents confirm it, lean in. If agents flag risk, respect it.
4. YOUR OWN ANALYSIS: You know thousands of publicly traded companies. If the user's sector focus and risk profile suggest a stock that agents haven't flagged (because they primarily analyze held positions, not the full market), include it based on your own judgment.

The goal: a portfolio where every position has a clear thesis, not a generic template.

## Output format (CRITICAL -- follow this exactly)

Respond with valid JSON and NOTHING ELSE. No markdown, no backticks, no explanation outside the JSON.

{"holdings":[{"symbol":"NVDA","name":"NVIDIA Corporation","allocation":5,"type":"Stock","reasoning":"Multi-agent consensus: Technical Analyst flags bullish breakout (confidence 8/10), Catalyst Tracker shows insider cluster buying $3.2M..."}],"strategy":{"name":"Short Name (2-5 words)","description":"1-2 sentence summary referencing current market conditions.","riskLevel":"conservative | moderate | aggressive","gemType":"Pearl | Sapphire | Ruby"}}

Rules:
- "allocation" values are integers summing to exactly 100
- "type" is one of: "ETF", "Stock", "Bond ETF", "Commodity ETF", "REIT"
- "reasoning" MUST reference specific intelligence: agent signals, insider activity, technical setups, sector rotation, earnings catalysts, or your own analysis. Generic reasoning like "solid company" is not acceptable.
- "riskLevel": derive from the portfolio specifications
- "gemType": Pearl for conservative, Sapphire for moderate, Ruby for aggressive
- ONLY include tradeable US securities available on Alpaca
- This is paper trading. Be concrete and opinionated.
- The number of holdings should match the composition guidance. More positions = more surface area for the agents to optimize over time.
- Do NOT default to ETFs. Individual stocks are where the agent intelligence creates an edge.`;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { profile, refinements } = req.body;

  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'profile object required' });
  }
  if (!refinements || typeof refinements !== 'object') {
    return res.status(400).json({ error: 'refinements object required' });
  }

  try {
    // Step 1: Pre-fetch ALL data in parallel (~1-2 seconds)
    const [account, positions, marketData, intelligence] = await Promise.all([
      fetchAccountSummary(),
      fetchPositionsSummary(),
      fetchMarketSnapshot(),
      getAllLatestIntelligence().catch(() => null),
    ]);

    // Step 2: Build prompt with structured agent intelligence
    const systemPrompt = buildPrompt(profile, refinements, account, positions, marketData, intelligence);

    // Step 3: Call Claude with higher token budget for larger portfolios
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Build my portfolio now. Return ONLY the JSON.' },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[generate-portfolio] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const rawResponse = textBlocks.map(b => b.text).join('');

    if (!rawResponse) {
      return res.status(502).json({ error: 'AI returned empty response. Please try again.' });
    }

    // Step 4: Parse the JSON response
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[generate-portfolio] JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'AI returned invalid format. Please try again.' });
    }

    if (!parsed.holdings || !Array.isArray(parsed.holdings) || parsed.holdings.length === 0) {
      return res.status(502).json({ error: 'AI returned empty holdings. Please try again.' });
    }

    // Normalise allocations to sum to exactly 100
    const totalAllocation = parsed.holdings.reduce((sum, h) => sum + (h.allocation || 0), 0);
    if (totalAllocation <= 0) {
      const equalWeight = Math.floor(100 / parsed.holdings.length);
      parsed.holdings = parsed.holdings.map((h, i) => ({
        ...h,
        allocation: i === 0 ? equalWeight + (100 - equalWeight * parsed.holdings.length) : equalWeight,
      }));
    } else if (totalAllocation !== 100) {
      const factor = 100 / totalAllocation;
      parsed.holdings = parsed.holdings.map(h => ({
        ...h,
        allocation: Math.round(h.allocation * factor),
      }));
      const newTotal = parsed.holdings.reduce((s, h) => s + h.allocation, 0);
      if (newTotal !== 100) {
        parsed.holdings[0].allocation += (100 - newTotal);
      }
    }

    return res.status(200).json({
      holdings: parsed.holdings,
      strategy: parsed.strategy || {
        name: 'AI-Generated Portfolio',
        description: 'Portfolio generated based on your preferences.',
        riskLevel: 'moderate',
        gemType: 'Sapphire',
      },
    });
  } catch (err) {
    console.error('[generate-portfolio] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Portfolio generation error' });
  }
}
