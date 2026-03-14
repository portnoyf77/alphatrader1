

## Remove Consistency Score from UI

Only one place displays `consistency_score` in the UI: the stat tile on the Strategy Detail page.

### Change

**`src/pages/StrategyDetail.tsx`** (lines 232–245): Remove the Consistency `<Tooltip>` + `<Card>` block entirely. Also remove the `Gauge` icon import if it's no longer used elsewhere.

The internal `consistency_score` field in `types.ts`, `mockData.ts`, and `alphaScore.ts` stays untouched — it's still used for the reputation calculation.

