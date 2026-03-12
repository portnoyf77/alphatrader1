

## Gap Analysis: Alpha Trader v4 Overhaul — What's Missing

After thorough inspection, here's what has been implemented vs what's still missing from the v4 prompt:

### Already Done (Sections 1-7, 19-21)
- ✅ Global "strategy" → "portfolio" in user-facing text (most places)
- ✅ /docs and /onboarding deleted
- ✅ /strategy/:id → /portfolio/:id redirect
- ✅ Nav renamed "Invest" → "Create", correct order
- ✅ Guest nav shows only logo + Sign In/Sign Up
- ✅ Crown logo on login, signup, 404
- ✅ Landing: "How It Works" section, free trial banner, correct hero text
- ✅ Signup: disclaimer checkbox, redirect to /dashboard, plan features listed
- ✅ Footer: 2026 copyright, "Create" label, no Docs link
- ✅ 404: uses PageLayout with navbar and styled button
- ✅ Fee model: 0.25% Alpha + 0.25% Platform consistent
- ✅ Routes correct

### NOT Implemented — Major Gaps

**Section 8: Dashboard Fixes**
- ❌ Rebalancing settings modal disclaimer text ("By selecting Auto-apply, you authorize...")
- ❌ "Invested In" tab: warning icon (⚠️) with tooltip on each row ("If this Alpha exits...")
- ❌ Simulating tab rows: clicking should navigate to `/simulation/:id` — needs verification
- ❌ Market news sector relevance tags showing

**Section 9: Marketplace Fixes**
- ❌ Portfolio cards missing "Creator Invested: $XXK" field
- ❌ Portfolio cards missing Alpha reputation badge (⭐ score)
- ❌ Leaderboard scores all showing "5" — reputation formula implemented in `alphaLeaderboard` but mock data `days_active` not varied (14-400 days range)

**Section 10: Create Portfolio Fixes**
- ❌ Gemstone color explanation on reveal ("Ruby reflects your high-risk, high-growth approach")
- ❌ "Invest Now" button on AI-Assisted tab results view (only on Manual tab)

**Section 11: Simulation Page Fixes**
- ❌ "Submit for Validation" button (appears after 30+ days)
- ❌ "Publish to Marketplace" button (appears after validation approved)

**Section 12: Portfolio Detail Fixes**
- ❌ Fee breakdown in allocate modal (Alpha 0.25% + Platform 0.25% = 0.50%, estimated annual cost)
- ❌ Holdings tab: IP protection for non-owners (hide tickers, show sector labels instead)
- ❌ Track Record tab: verify Dow Jones included alongside S&P 500

**Section 13: Portfolio Owner Detail Fixes**
- ❌ Liquidate confirmation dialog with specific warning text
- ❌ Verify Rebalance, Propose Major Update, Pause/Resume, Liquidate buttons exist

**Section 14: Alpha Page Fixes**
- ❌ Duplicate disclaimer — page shows disclaimer TWICE (page content + footer)
- ❌ Requirements list: verify min 30-day sim, max 20% drawdown, min 5 holdings, risk disclosure, email verification

**Section 17: Iconography Audit — ENTIRELY MISSING**
- ❌ Nav: "Create" uses PenTool → should use Sparkles (✨)
- ❌ Nav: "Become an Alpha" uses Crown → should use Gem (💎). Crown is brand-only.
- ❌ Portfolio detail stat tiles: missing icons for Creator Invested, Allocated, Consistency
- ❌ Portfolio detail tabs: no icons (Overview, Holdings, Exposure, Track Record, etc.)
- ❌ Dashboard tabs: no icons (My Portfolios, Invested In, Simulating)
- ❌ Marketplace filter dropdowns: no contextual icons
- ❌ Create page tab switcher: no icons for AI-Assisted / Manual

**Section 18: Visual Design Overhaul — ENTIRELY MISSING**
This is the largest gap. Nothing from Section 18 has been implemented:

- ❌ **18A Typography**: Still using Space Grotesk + Inter. Prompt says "Do NOT use Space Grotesk (overused in AI products)." Should switch to Plus Jakarta Sans / Outfit / Satoshi. Hero headlines should be 48-64px. Body 15-16px. `font-variant-numeric: tabular-nums` for financial data.
- ❌ **18B Color & Depth**: Flat background, no subtle gradient. Cards have no elevation/glow. No gradient on CTA buttons. No glassmorphism on stat tiles.
- ❌ **18C Landing Page**: No animated background (particle field / pulsing gradient). No count-up animations on stats. No numbered steps with connecting lines in How It Works. CTA cards at bottom are plain.
- ❌ **18D Dashboard**: No accent color bars on stat tiles. Chart lines thin with no area fills. Table rows have no hover state with purple left border. No left border colors on pending update cards.
- ❌ **18E Marketplace**: No gemstone colored icons on portfolio cards. Top Performers bar chart all same purple — should be gemstone-colored. Leaderboard has no row striping.
- ❌ **18F Portfolio Detail**: No gemstone icon in header. No glassmorphism on stat tiles. Tab bar has no solid underline/pill active indicator.
- ❌ **18G Simulation**: No pulsing green dot. No glow on chart line. No gradient stroke on portfolio line.
- ❌ **18H Create Page**: No icons on tab switcher. AI chat has no avatar icon. No hover animation on quick reply buttons. No entrance animation on portfolio reveal.
- ❌ **18I Alpha Page**: No green glow on earnings numbers. No animated counting on slider change. No gemstone icons on testimonial cards.
- ❌ **18J Motion & Micro-interactions**: No page fade-in transitions. No card hover scale effects. No button glow on hover. No number count-up animations. No chart line drawing animation. No tab crossfade. No spring animation on toasts.

---

### Implementation Plan

Due to the massive scope (Sections 17 + 18 alone are ~60 individual changes), I'll organize into batches:

**Batch 1 — Typography & Color Foundation**
- Replace Space Grotesk with Plus Jakarta Sans in `index.html` and `index.css`
- Add subtle background gradient, card elevation, CTA button gradients, glassmorphism utility classes in `index.css`
- Add `font-variant-numeric: tabular-nums` for financial data
- Increase hero font sizes

**Batch 2 — Iconography Sweep**
- Update Navbar icons: Create → Sparkles, Become an Alpha → Gem
- Add icons to Dashboard tabs, Portfolio Detail tabs, Create page tabs
- Add stat tile icons across Portfolio Detail and Dashboard
- Add filter icons in Marketplace

**Batch 3 — Motion & Micro-interactions**
- Add page transition fade-in via CSS
- Card hover scale + border glow
- Button hover glow
- Tab crossfade
- Pulsing green dot on simulation

**Batch 4 — Page-Specific Visual Enhancements**
- Landing: animated background, count-up stats, numbered How It Works steps
- Dashboard: stat tile accent bars, chart area fills, table row hover states
- Marketplace: gemstone icons on cards, colored bars in chart, Creator Invested + reputation badge on cards
- Portfolio Detail: gemstone icon in header, glassmorphism tiles, fee breakdown in modal, IP-protected holdings
- Simulation: validation/publish buttons, gradient chart stroke
- Alpha: deduplicate disclaimer, earnings number animation
- Create: gemstone explanation on reveal, Invest Now on AI tab

**Batch 5 — Remaining Functional Gaps**
- Dashboard: rebalancing modal disclaimer, invested-in warning tooltips
- Portfolio Owner: liquidate confirmation, verify controls exist
- Simulation: Submit for Validation / Publish buttons
- Mock data: vary `days_active` for reputation score spread

This is a very large implementation (~15-20 files, hundreds of lines). Shall I proceed?

