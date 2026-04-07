/**
 * Client for POST /api/auto-rebalance and persisted target allocations.
 */

import { serverlessApiUrl, explainServerlessNetworkError } from '@/lib/serverlessApiUrl';

export const REBALANCE_STORAGE_KEY = 'alpha_rebalance_targets';

export type TargetAllocation = { symbol: string; targetPct: number };

export type StoredRebalanceSettings = {
  targets: TargetAllocation[];
  driftThreshold: number;
  maxTradeValue: number | null;
};

export type RebalanceDrift = {
  symbol: string;
  targetPct: number;
  currentPct: number;
  driftPct: number;
  price?: number;
  targetValue?: number;
  currentValue?: number;
  valueDiff?: number;
  suggestedSide?: string;
  suggestedQty?: number;
};

export type RebalanceTrade = {
  symbol: string;
  side: string;
  qty: number;
  reasoning?: string;
  status?: string;
  orderId?: string;
  orderStatus?: string;
  reason?: string;
};

export type RebalanceResponse = {
  trades: RebalanceTrade[];
  analysis: string;
  drifts: RebalanceDrift[];
  dryRun?: boolean;
};

export type RebalanceRequestBody = {
  targetAllocations: TargetAllocation[];
  driftThreshold: number;
  maxTradeValue?: number;
  dryRun: boolean;
};

const DEFAULT_SETTINGS: StoredRebalanceSettings = {
  targets: [],
  driftThreshold: 5,
  maxTradeValue: null,
};

export function loadRebalanceSettings(): StoredRebalanceSettings | null {
  try {
    const raw = localStorage.getItem(REBALANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return {
        targets: parsed.filter(
          (t): t is TargetAllocation =>
            t &&
            typeof t === 'object' &&
            typeof (t as TargetAllocation).symbol === 'string' &&
            typeof (t as TargetAllocation).targetPct === 'number',
        ),
        driftThreshold: 5,
        maxTradeValue: null,
      };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as StoredRebalanceSettings).targets)) {
      const o = parsed as StoredRebalanceSettings;
      return {
        targets: o.targets.map((t) => ({
          symbol: String(t.symbol).toUpperCase(),
          targetPct: Number(t.targetPct) || 0,
        })),
        driftThreshold: typeof o.driftThreshold === 'number' ? o.driftThreshold : 5,
        maxTradeValue: o.maxTradeValue == null || o.maxTradeValue === '' ? null : Number(o.maxTradeValue),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveRebalanceSettings(settings: StoredRebalanceSettings): void {
  const payload = {
    targets: settings.targets.map((t) => ({
      symbol: t.symbol.trim().toUpperCase(),
      targetPct: Math.max(0, Math.min(100, Number(t.targetPct) || 0)),
    })),
    driftThreshold: Math.max(1, Math.min(15, Number(settings.driftThreshold) || 5)),
    maxTradeValue:
      settings.maxTradeValue == null || settings.maxTradeValue === 0
        ? null
        : Math.max(0, Number(settings.maxTradeValue)),
  };
  localStorage.setItem(REBALANCE_STORAGE_KEY, JSON.stringify(payload));
}

/** Equal-weight targets from open positions (100% / n). */
export function defaultTargetsFromPositions(symbols: string[]): TargetAllocation[] {
  const uniq = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (uniq.length === 0) return [];
  const w = 100 / uniq.length;
  return uniq.map((symbol) => ({ symbol, targetPct: Math.round(w * 100) / 100 }));
}

export function sumTargetPct(targets: TargetAllocation[]): number {
  return targets.reduce((s, t) => s + (Number(t.targetPct) || 0), 0);
}

export async function postAutoRebalance(body: RebalanceRequestBody): Promise<RebalanceResponse> {
  let res: Response;
  try {
    res = await fetch(serverlessApiUrl('/api/auto-rebalance'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetAllocations: body.targetAllocations.map((t) => ({
          symbol: t.symbol.trim().toUpperCase(),
          targetPct: Number(t.targetPct),
        })),
        driftThreshold: body.driftThreshold,
        maxTradeValue: body.maxTradeValue,
        dryRun: body.dryRun,
      }),
    });
  } catch (e) {
    throw new Error(explainServerlessNetworkError(e));
  }

  const data = (await res.json()) as RebalanceResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Rebalance failed (${res.status})`);
  }
  if (data.error) throw new Error(data.error);

  const trades = (data.trades || []).map((t) => ({
    ...t,
    qty: typeof t.qty === 'string' ? parseFloat(t.qty) : Number(t.qty) || 0,
    side: String(t.side || '').toLowerCase(),
  }));

  return {
    trades,
    analysis: data.analysis || '',
    drifts: data.drifts || [],
    dryRun: data.dryRun,
  };
}

export function mergeSettingsWithDefaults(
  stored: StoredRebalanceSettings | null,
  positions: { symbol: string }[],
): StoredRebalanceSettings {
  if (stored && stored.targets.length > 0) {
    return { ...DEFAULT_SETTINGS, ...stored, targets: [...stored.targets] };
  }
  const syms = positions.map((p) => p.symbol);
  return {
    ...DEFAULT_SETTINGS,
    targets: defaultTargetsFromPositions(syms),
  };
}

export function driftSeverity(
  driftPct: number,
  threshold: number,
): 'ok' | 'warn' | 'bad' {
  const a = Math.abs(driftPct);
  if (a <= threshold * 0.55) return 'ok';
  if (a <= threshold) return 'warn';
  return 'bad';
}
