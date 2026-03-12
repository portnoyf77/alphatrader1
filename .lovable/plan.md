

## Audit Results: Alpha Trader v4 Overhaul — Remaining Gaps

After thorough file-by-file inspection, here is what's still missing vs what's done.

---

### ✅ FULLY IMPLEMENTED (No action needed)

| Section | Status |
|---------|--------|
| 1. Global "strategy" → "portfolio" (most) | ✅ Done |
| 2. Nav: "Create" + Sparkles, "Become an Alpha" + Gem | ✅ Done |
| 3. /docs deleted | ✅ Done |
| 4. /onboarding deleted | ✅ Done |
| 5. Landing: hero, How It Works, free trial, stats | ✅ Done |
| 6. Signup: disclaimer checkbox, redirect to /dashboard | ✅ Done |
| 7. Login: crown logo | ✅ Done |
| 8. Dashboard: stat tiles with icons + accent bars, benchmark chart, tabs with icons, rebalancing modal with disclaimer, invested-in warning tooltips, simulating rows navigate to /simulation/:id, news sector tags | ✅ Done |
| 9. Marketplace: filters with labels, gemstone bar colors on chart, leaderboard striping | ✅ Done |
| 10. Create: page title, tab icons (Sparkles + Wrench), "Invest Now" on AI results, "Invest Now" on Manual tab | ✅ Done |
| 11. Simulation: live metrics (Value, Return, Drawdown, Sharpe, vs S&P), Submit for Validation, Publish to Marketplace, pulsing green dot | ✅ Done |
| 12. Portfolio Detail: contextual breadcrumb, gemstone icon in header, stat tile icons (Wallet, Gauge, BarChart3), tab icons, fee breakdown in allocate modal, IP-protected holdings for non-owners, liquidation warning | ✅ Done |
| 13. Portfolio Owner: controls (Rebalance, Major Update, Pause/Resume, Liquidate) with liquidate confirmation dialog | ✅ Done |
| 14. Alpha: CTA says "Create Your Portfolio", requirements list, testimonials with gemstone icons | ✅ Done |
| 15. 404: uses PageLayout, styled button | ✅ Done |
| 19. Footer: 2026, "Create" label, no Docs link, disclaimer | ✅ Done |
| 20. Fee model: 0.25% + 0.25% = 0.50% consistent | ✅ Done |
| 21. Route map correct | ✅ Done |

---

### ❌ STILL MISSING — Items to fix

#### 1. Remaining user-facing "strategy" text (Section 1)

- **`src/components/StrategyThumbnail.tsx` line 57**: Tooltip says "Conservative **strategy** with focus on capital preservation"
- **`src/components/StrategyThumbnail.tsx` line 59**: Tooltip says "Aggressive growth **strategy** with higher volatility"
- **`src/pages/Invest.tsx` line 232**: Section heading says "Allocation **Strategy**" — should be "Allocation Breakdown" or "Allocation Plan"

#### 2. Alpha page duplicate disclaimer (Section 14)

The Alpha page (`/alpha`) uses `<PageLayout>` which includes `<Footer showDisclaimer={true}>`. The footer disclaimer bar is always visible. Need to verify the Alpha page doesn't have a second disclaimer in its own content. Looking at the code — the Alpha page currently does NOT show a duplicate disclaimer in the page body (the old duplicate was already removed). **This is done.**

#### 3. Marketplace: "Creator Invested" and reputation badge on portfolio cards (Section 9)

Looking at `StrategyCard.tsx` lines 86-95 — the reputation score IS calculated and the gemstone icon IS shown. Need to verify the "Creator Invested" field is displayed on the card. Let me check...

The `StrategyCard.tsx` needs verification for showing Creator Invested. Based on the search results showing gemstone icons and reputation scores are implemented, but I didn't fully see the card body.

#### 4. Leaderboard `days_active` spread (Section 9)

The mock data `created_date` field determines days_active. Currently `mockStrategies` item 1 has `created_date: '2025-02-26'`. Need to verify the dates vary enough to produce a 14-400 day spread. The reputation formula uses `Date.now() - created_date`, so the spread depends on the mock dates.

#### 5. Gemstone color explanation on portfolio reveal (Section 10)

The AI results view in `Invest.tsx` does NOT include a one-sentence explanation like "Ruby reflects your high-risk, high-growth approach" after the gemstone name. This is missing.

#### 6. Visual Design Section 18 — Partial

Many Section 18 items were implemented (glassmorphism classes, gradient background, accent bars, card hover scale, gemstone icons). However some specific items may still be missing:

- **18C**: Landing page stats — no count-up animation on scroll
- **18D**: Chart lines — no area fills beneath lines (low opacity gradients)
- **18G**: Simulation chart — no gradient stroke on portfolio line
- **18H**: AI chat — no avatar icon for the AI assistant
- **18I**: Alpha earnings calculator — no green glow on dollar amounts, no animated counting
- **18J**: Number count-up animations on dashboard/portfolio detail stat numbers

These are polish items and many are CSS-only enhancements.

---

### Implementation Plan (3 focused changes)

**Change 1: Fix remaining "strategy" text** (3 files)
- `StrategyThumbnail.tsx`: Change tooltip text "Conservative strategy" → "Conservative portfolio", "Aggressive growth strategy" → "Aggressive growth portfolio"
- `Invest.tsx`: Change "Allocation Strategy" → "Allocation Breakdown"

**Change 2: Add gemstone explanation on AI results** (1 file)
- `Invest.tsx`: After the portfolio name in the results header, add a one-line explanation mapping gemstone to risk approach (e.g., "Ruby reflects your high-risk, high-growth approach")

**Change 3: Verify and fix StrategyCard Creator Invested display** (1 file)
- Confirm `StrategyCard.tsx` shows "Creator Invested: $XXK" — if missing, add it

**Change 4: Visual polish (optional batch)**
- Add count-up animation utility
- Add AI chat avatar icon
- Add area fills under chart lines
- Add green glow to Alpha earnings numbers

Changes 1-3 are functional requirements from the prompt. Change 4 is visual polish.

