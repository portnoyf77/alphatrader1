import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Loader2,
  RefreshCw,
  Settings2,
  Sparkles,
  FlaskConical,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { PositionSummary } from '@/hooks/useAlpacaPositions';
import {
  loadRebalanceSettings,
  saveRebalanceSettings,
  mergeSettingsWithDefaults,
  postAutoRebalance,
  sumTargetPct,
  driftSeverity,
  type StoredRebalanceSettings,
  type TargetAllocation,
  type RebalanceResponse,
  type RebalanceTrade,
} from '@/lib/rebalanceService';

const SYMBOL_RE = /^[A-Za-z]{1,6}$/;

function tradeStatusBadge(trade: RebalanceTrade, dryRun: boolean) {
  if (dryRun || !trade.status) {
    return (
      <Badge variant="secondary" className="bg-violet-500/15 text-violet-300 border-violet-500/25">
        proposed
      </Badge>
    );
  }
  const s = trade.status.toLowerCase();
  if (s === 'placed') {
    return (
      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
        placed
      </Badge>
    );
  }
  if (s === 'failed') {
    return <Badge variant="destructive">failed</Badge>;
  }
  if (s === 'skipped') {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-400">
        skipped
      </Badge>
    );
  }
  return <Badge variant="outline">{trade.status}</Badge>;
}

function DriftDot({ level }: { level: 'ok' | 'warn' | 'bad' }) {
  const color =
    level === 'ok' ? '#10B981' : level === 'warn' ? '#FBBF24' : '#EF4444';
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}88` }}
      title={level === 'ok' ? 'Within range' : level === 'warn' ? 'Approaching threshold' : 'Exceeds threshold'}
    />
  );
}

type RebalancerWidgetProps = {
  positions: PositionSummary[];
  equity: number;
  positionsLoading: boolean;
  onRefetchPositions: () => void;
};

export function RebalancerWidget({
  positions,
  equity,
  positionsLoading,
  onRefetchPositions,
}: RebalancerWidgetProps) {
  const [settings, setSettings] = useState<StoredRebalanceSettings>(() =>
    mergeSettingsWithDefaults(loadRebalanceSettings(), []),
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<StoredRebalanceSettings | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [newSymbolError, setNewSymbolError] = useState<string | null>(null);

  const [lastResult, setLastResult] = useState<RebalanceResponse | null>(null);
  const [apiPhase, setApiPhase] = useState<'idle' | 'dry' | 'live'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dryRunReviewed, setDryRunReviewed] = useState(false);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const stored = loadRebalanceSettings();
    if (stored?.targets?.length) {
      setSettings(mergeSettingsWithDefaults(stored, positions));
      initialized.current = true;
      return;
    }
    if (positions.length > 0) {
      setSettings(mergeSettingsWithDefaults(null, positions));
      initialized.current = true;
    }
  }, [positions]);

  const openEditor = useCallback(() => {
    setEditorDraft({ ...settings, targets: settings.targets.map((t) => ({ ...t })) });
    setNewSymbol('');
    setNewSymbolError(null);
    setEditorOpen(true);
  }, [settings]);

  const driftsForDisplay = useMemo(() => {
    if (lastResult?.drifts?.length) return lastResult.drifts;
    return settings.targets.map((t) => {
      const pos = positions.find((p) => p.symbol === t.symbol);
      const currentPct =
        equity > 0 && pos ? (pos.marketValue / equity) * 100 : 0;
      const c = Math.round(currentPct * 100) / 100;
      return {
        symbol: t.symbol,
        targetPct: t.targetPct,
        currentPct: c,
        driftPct: Math.round((c - t.targetPct) * 100) / 100,
      };
    });
  }, [lastResult, settings.targets, positions, equity]);

  const runDryRun = async () => {
    if (settings.targets.length === 0) {
      setError('Set target allocations in the editor first.');
      return;
    }
    const total = sumTargetPct(settings.targets);
    if (total > 105) {
      setError('Target allocations must sum to at most 100%.');
      return;
    }
    setError(null);
    setApiPhase('dry');
    try {
      const res = await postAutoRebalance({
        targetAllocations: settings.targets,
        driftThreshold: settings.driftThreshold,
        maxTradeValue: settings.maxTradeValue ?? undefined,
        dryRun: true,
      });
      setLastResult(res);
      setDryRunReviewed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dry run failed');
      setDryRunReviewed(false);
    } finally {
      setApiPhase('idle');
    }
  };

  const runLive = async () => {
    if (!dryRunReviewed || !lastResult) return;
    setError(null);
    setApiPhase('live');
    try {
      const res = await postAutoRebalance({
        targetAllocations: settings.targets,
        driftThreshold: settings.driftThreshold,
        maxTradeValue: settings.maxTradeValue ?? undefined,
        dryRun: false,
      });
      setLastResult(res);
      setDryRunReviewed(false);
      onRefetchPositions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rebalance failed');
    } finally {
      setApiPhase('idle');
    }
  };

  const handleRunAgain = () => {
    setLastResult(null);
    setDryRunReviewed(false);
    setError(null);
    onRefetchPositions();
  };

  const saveEditor = () => {
    if (!editorDraft) return;
    saveRebalanceSettings(editorDraft);
    setSettings({ ...editorDraft });
    setEditorOpen(false);
    setDryRunReviewed(false);
    setLastResult(null);
  };

  const updateDraftTarget = (symbol: string, pct: string) => {
    if (!editorDraft) return;
    const n = parseFloat(pct);
    setEditorDraft({
      ...editorDraft,
      targets: editorDraft.targets.map((t) =>
        t.symbol === symbol ? { ...t, targetPct: Number.isFinite(n) ? n : 0 } : t,
      ),
    });
  };

  const addDraftSymbol = () => {
    const s = newSymbol.trim().toUpperCase();
    if (!SYMBOL_RE.test(s)) {
      setNewSymbolError('Use 1–6 letters (e.g. VTI).');
      return;
    }
    if (!editorDraft) return;
    if (editorDraft.targets.some((t) => t.symbol === s)) {
      setNewSymbolError('Symbol already listed.');
      return;
    }
    setEditorDraft({
      ...editorDraft,
      targets: [...editorDraft.targets, { symbol: s, targetPct: 0 }],
    });
    setNewSymbol('');
    setNewSymbolError(null);
  };

  const removeDraftRow = (symbol: string) => {
    if (!editorDraft) return;
    setEditorDraft({
      ...editorDraft,
      targets: editorDraft.targets.filter((t) => t.symbol !== symbol),
    });
  };

  const editorTotal = editorDraft ? sumTargetPct(editorDraft.targets) : 0;
  const totalOk = editorTotal <= 100.5 && editorTotal >= 97;

  const busy = apiPhase !== 'idle';

  if (!positionsLoading && positions.length === 0 && settings.targets.length === 0) {
    return (
      <Card
        className="border border-[rgba(255,255,255,0.1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
      >
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Portfolio Rebalancer
            <Badge
              variant="outline"
              className="text-[0.65rem] border-violet-500/35 text-violet-300 bg-violet-500/10"
            >
              Powered by AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open positions in your paper account to set target allocations and run the AI rebalancer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="border border-[rgba(255,255,255,0.1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between space-y-0">
          <div>
            <CardTitle className="text-lg flex flex-wrap items-center gap-2">
              Portfolio Rebalancer
              <Badge
                variant="outline"
                className="text-[0.65rem] font-medium border-violet-500/35 text-violet-300 bg-violet-500/10"
              >
                <Sparkles className="h-3 w-3 mr-1 inline opacity-90" />
                Powered by AI
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Compare drift to targets, preview trades with a dry run, then rebalance on paper when you are ready.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={openEditor}>
            <Settings2 className="h-4 w-4" />
            Edit targets
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {positionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
              <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
              <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
            </div>
          ) : (
            <div className="space-y-4">
              {driftsForDisplay.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No target symbols yet. Open the editor to add allocations.
                </p>
              ) : (
                driftsForDisplay.map((d) => {
                  const sev = driftSeverity(d.driftPct, settings.driftThreshold);
                  const cap = Math.min(100, Math.max(d.currentPct, d.targetPct) * 1.15);
                  const scale = cap > 0 ? 100 / cap : 1;
                  const wCur = Math.min(100, d.currentPct * scale);
                  const wTgt = Math.min(100, d.targetPct * scale);
                  return (
                    <div key={d.symbol} className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 font-mono font-semibold">
                          <DriftDot level={sev} />
                          {d.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-emerald-400/90">{((d?.currentPct ?? 0)).toFixed(1)}%</span>
                          {' · '}
                          target{' '}
                          <span className="text-violet-300/90">{((d?.targetPct ?? 0)).toFixed(1)}%</span>
                          {' · '}
                          drift{' '}
                          <span
                            className={cn(
                              sev === 'ok' && 'text-emerald-400',
                              sev === 'warn' && 'text-amber-400',
                              sev === 'bad' && 'text-red-400',
                            )}
                          >
                            {(d?.driftPct ?? 0) > 0 ? '+' : ''}
                            {((d?.driftPct ?? 0)).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-0.5">
                            Current
                          </p>
                          <div className="h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/55 transition-all"
                              style={{ width: `${wCur}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-0.5">
                            Target
                          </p>
                          <div className="h-2.5 rounded-full bg-secondary/80 overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-violet-500/45 transition-all"
                              style={{ width: `${wTgt}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
              disabled={busy || settings.targets.length === 0}
              onClick={runDryRun}
            >
              {apiPhase === 'dry' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              Dry run
            </Button>
            <Button
              variant="destructive"
              className="gap-2 bg-red-600 hover:bg-red-500"
              disabled={busy || !dryRunReviewed || lastResult?.dryRun !== true}
              onClick={runLive}
              title={!dryRunReviewed ? 'Run a dry run first to review proposed trades' : undefined}
            >
              {apiPhase === 'live' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Rebalance now (live)
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleRunAgain}>
              <RefreshCw className="h-4 w-4" />
              Run again
            </Button>
          </div>

          {lastResult?.analysis && (
            <blockquote
              className="border-l-2 border-violet-500/50 pl-4 py-1 text-sm text-muted-foreground italic leading-relaxed"
              style={{ background: 'rgba(124,58,237,0.06)' }}
            >
              {lastResult.analysis}
            </blockquote>
          )}

          {lastResult && (lastResult.trades || []).length > 0 && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-transparent">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Reasoning</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(lastResult?.trades || []).map((t, i) => (
                    t && (
                      <TableRow key={`${t?.symbol || 'unknown'}-${i}`} className="border-[rgba(255,255,255,0.1)]">
                        <TableCell className="font-mono font-medium">{t?.symbol || '?'}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'font-medium',
                              t?.side === 'buy' ? 'text-emerald-400' : 'text-red-400',
                            )}
                          >
                            {(t?.side || 'buy').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{t?.qty || 0}</TableCell>
                        <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                          {t?.reasoning || '—'}
                        </TableCell>
                        <TableCell>{tradeStatusBadge(t, !!(lastResult?.dryRun))}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {t?.orderId ? (
                            <span>
                              {t.orderId.slice(0, 8)}…
                              {t?.orderStatus && (
                                <span className="block text-[0.65rem]">{t.orderStatus}</span>
                              )}
                            </span>
                          ) : t?.reason ? (
                            <span className="text-amber-400/90">{t.reason}</span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {lastResult && (lastResult?.trades || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No trades proposed — portfolio within threshold.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Target allocations</DialogTitle>
            <DialogDescription>
              Set target weights, drift sensitivity, and optional max trade size. Saved locally in this browser.
            </DialogDescription>
          </DialogHeader>

          {editorDraft && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Drift threshold (%)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={1}
                    max={15}
                    step={1}
                    value={[editorDraft.driftThreshold]}
                    onValueChange={([v]) =>
                      setEditorDraft({ ...editorDraft, driftThreshold: v })
                    }
                    className="flex-1"
                  />
                  <span className="font-mono text-sm w-8">{editorDraft.driftThreshold}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-trade" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Max trade value (optional)
                </Label>
                <Input
                  id="max-trade"
                  type="number"
                  min={0}
                  placeholder="No limit"
                  value={editorDraft.maxTradeValue ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditorDraft({
                      ...editorDraft,
                      maxTradeValue: v === '' ? null : Math.max(0, Number(v) || 0),
                    });
                  }}
                />
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-[rgba(255,255,255,0.1)]">
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Current %</TableHead>
                      <TableHead className="w-[100px]">Target %</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editorDraft.targets.map((row) => {
                      const pos = positions.find((p) => p.symbol === row.symbol);
                      const cur =
                        equity > 0 && pos ? (pos.marketValue / equity) * 100 : 0;
                      return (
                        <TableRow key={row.symbol} className="border-[rgba(255,255,255,0.1)]">
                          <TableCell className="font-mono font-medium">{row.symbol}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {((cur ?? 0)).toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              className="h-9 font-mono text-sm"
                              value={row.targetPct}
                              onChange={(e) => updateDraftTarget(row.symbol, e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                              onClick={() => removeDraftRow(row.symbol)}
                            >
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Add symbol</Label>
                  <Input
                    placeholder="e.g. VTI"
                    value={newSymbol}
                    onChange={(e) => {
                      setNewSymbol(e.target.value.toUpperCase());
                      setNewSymbolError(null);
                    }}
                    className="font-mono uppercase"
                  />
                  {newSymbolError && (
                    <p className="text-xs text-red-400">{newSymbolError}</p>
                  )}
                </div>
                <Button type="button" variant="secondary" onClick={addDraftSymbol}>
                  Add
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total allocation</span>
                  <span
                    className={cn(
                      'font-mono font-medium',
                      totalOk ? 'text-emerald-400' : editorTotal > 100 ? 'text-red-400' : 'text-amber-400',
                    )}
                  >
                    {((editorTotal ?? 0)).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      editorTotal > 100 ? 'bg-red-500/70' : totalOk ? 'bg-emerald-500/60' : 'bg-amber-500/60',
                    )}
                    style={{ width: `${Math.min(100, editorTotal)}%` }}
                  />
                </div>
                {!totalOk && editorTotal <= 100 && (
                  <p className="text-xs text-amber-400/90 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Aim for ~100% (97–100.5% is ok).
                  </p>
                )}
                {editorTotal > 100 && (
                  <p className="text-xs text-red-400">Total cannot exceed 100% (API rejects &gt;105%).</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEditor}
              disabled={!editorDraft || editorTotal > 105 || editorDraft.targets.length === 0}
            >
              Save targets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
