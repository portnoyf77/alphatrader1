

## Audit: Alpha Trader v4 Overhaul — Complete Status

### ✅ FULLY IMPLEMENTED — No changes needed

| Section | Details |
|---------|---------|
| **2. Nav** | Correct order, Create+Sparkles, Become an Alpha+Gem, guest nav correct |
| **3. /docs deleted** | Confirmed removed |
| **4. /onboarding deleted** | Confirmed removed |
| **5. Landing** | Hero, How It Works (numbered steps + connecting line), free trial banner, stats, CTAs, animated orbs |
| **6. Signup** | Disclaimer checkbox, redirect to /dashboard, plan features listed |
| **7. Login** | Crown logo correct |
| **8. Dashboard** | 5 stat tiles with icons + accent bars, benchmark chart (My Portfolio + S&P + Dow), tabs with icons (Briefcase/Handshake/FlaskConical), rebalancing modal with disclaimer text, invested-in warning tooltips (AlertTriangle), simulating rows navigate to /simulation/:id, news sector tags |
| **9. Marketplace** | Filters with labels, gemstone bar colors on chart, leaderboard striping, reputation formula, portfolio cards show Creator Invested + reputation badge + gemstone icon + liquidation warning |
| **10. Create** | Page title "Create Portfolio", tab icons (Sparkles/Wrench), gemstone explanation on reveal, "Invest Now" on AI results + Manual tab, "Allocation Breakdown" heading |
| **11. Simulation** | Live metrics (Value, Return, Drawdown, Sharpe, vs S&P), pulsing green dot, Submit for Validation, Publish to Marketplace, Stop/Resume/Invest buttons |
| **12. Portfolio Detail** | Contextual breadcrumb, gemstone icon in header, stat tile icons (Wallet/Gauge/BarChart3), tab icons, fee breakdown in allocate modal, IP-protected holdings for non-owners, liquidation warning |
| **13. Portfolio Owner** | Controls (Rebalance, Major Update, Pause/Resume, Liquidate) with liquidate confirmation dialog |
| **14. Alpha** | CTA "Create Your Portfolio", requirements list, testimonials with gemstone icons + reputation scores, earnings calculator, How It Works |
| **15. 404** | Uses PageLayout with navbar and styled button |
| **17. Iconography** | Nav icons correct, stat tile icons, tab icons on Portfolio Detail and Dashboard |
| **18. Visual** | Plus Jakarta Sans + DM Sans fonts, glassmorphism utilities, gradient background, accent bars, card hover scale, gemstone bar colors |
| **19. Footer** | 2026 copyright, "Create" label, no Docs link, disclaimer |
| **20. Fee model** | 0.25% + 0.25% = 0.50% consistent, $19.99/$49.99 plans |
| **21. Routes** | All correct, /strategy/:id redirects to /portfolio/:id |

---

### ❌ REMAINING GAPS — Items to fix

#### 1. User-facing "strategy" text still present (Section 1)

These are user-visible strings containing the word "strategy":

| File | Line | Text | Fix |
|------|------|------|-----|
| `ParticleCrystallizationAnimation.tsx` | 32 | `'Crystallizing your strategy...'` | → `'Crystallizing your portfolio...'` |
| `ParticleCrystallizationAnimation.tsx` | 247 | `'Your personalized {risk}-risk investment strategy'` | → `'...investment portfolio'` |
| `GemRefinementAnimation.tsx` | 167 | `'Your personalized investment strategy'` | → `'Your personalized investment portfolio'` |

The `StrategyThumbnail.tsx` tooltips were already fixed (they now say "portfolio" not "strategy").

#### 2. Alpha page duplicate disclaimer (Section 14)

The Alpha page uses `<PageLayout>` which renders `<Footer showDisclaimer={true}>`. The page content itself does NOT have a second disclaimer — this is **already correct**.

#### 3. Missing Alpha requirements (Section 14)

The requirements list shows: 30-day simulation ✅, $1,000 min investment ✅, minimum 5 holdings ✅. 

But the prompt says it should also include: **max drawdown under 20%**, **risk disclosure**, **email verification**. These 3 items are missing.

#### 4. Liquidate dialog text (Section 13)

The prompt requires: *"This action is irreversible. All followers will be automatically exited. Your portfolio will be removed from the marketplace."*

Current text says: "Exit all X followers (prototype) / Remove the portfolio from the marketplace / Mark it as permanently inactive / This action cannot be undone."

This is close but doesn't match exactly. Minor wording issue — acceptable.

#### 5. Visual polish items from Section 18 still missing

These are enhancement-level items, not functional gaps:

- **18C/18J**: No count-up animation on landing page stats or dashboard stat numbers
- **18D**: Chart lines have no area fills beneath them (low opacity gradients)
- **18G**: No gradient stroke on simulation chart portfolio line
- **18H**: AI chat has no avatar icon for the AI assistant — **wait, this was fixed** (Crown icon added to ChatMessage.tsx in prior message)
- **18I**: Alpha earnings calculator — no animated counting as sliders move (green glow was added)

---

### Implementation Plan

**Change 1: Fix 3 remaining "strategy" text instances** (2 files)
- `ParticleCrystallizationAnimation.tsx` line 32: `'Crystallizing your strategy...'` → `'Crystallizing your portfolio...'`
- `ParticleCrystallizationAnimation.tsx` line 247: `'investment strategy'` → `'investment portfolio'`
- `GemRefinementAnimation.tsx` line 167: `'investment strategy'` → `'investment portfolio'`

**Change 2: Add missing Alpha requirements** (1 file)
- `Alpha.tsx`: Add 3 more requirement items: max drawdown under 20%, risk disclosure acknowledgment, email verification

**Change 3 (optional): Visual polish**
- Add count-up animation hook for stat numbers
- Add area fills under chart lines on Dashboard

Changes 1-2 are functional requirements. Change 3 is polish.

