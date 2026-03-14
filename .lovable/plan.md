

## Assessment: Tour System Already Exists

The entire guided tour system described in this prompt is **already fully implemented**:

- **TourWelcomeModal** + **TourWelcomeModalWrapper**: Welcome modal with Guided Tour / Explore Freely options ✅
- **GuidedTour component**: SVG spotlight mask, annotation cards, auto-positioning, mobile bottom-sheet, smooth transitions ✅
- **TourContext**: 14 steps, localStorage persistence, pause/resume, restart ✅
- **App.tsx integration**: Welcome modal after demo gate, GuidedTour rendered globally ✅
- **Navbar**: "Restart Tour" in user dropdown (desktop + mobile) ✅
- **All `data-tour` selectors** on Dashboard, Explore, StrategyDetail, Invest, Simulation pages ✅

### One Minor Fix Needed

Steps 12 and 13 (Alpha Flywheel / Revenue Model) currently point to `/invest` with `[data-tour="create-header"]` — a fallback from when the `/alpha` route was removed. The prompt specifies these should target the **Landing page's dual CTA / Alpha section**.

**Changes:**

1. **`src/pages/Landing.tsx`** — Add `data-tour="alpha-cta"` to the dual CTA section wrapper (line ~412) and `data-tour="alpha-fee-text"` to the Alpha CTA card (line ~436)

2. **`src/contexts/TourContext.tsx`** — Update steps 12 and 13:
   - Step 12: `page: '/'`, `selector: '[data-tour="alpha-cta"]'`, title/body unchanged (Alpha Flywheel)
   - Step 13: `page: '/'`, `selector: '[data-tour="alpha-fee-text"]'`, title: "Revenue Model", body about aligned incentives and 0.25% + 0.25% fee structure

No other files need changes. The tour overlay, welcome modal, state management, spotlight system, and restart functionality are all working correctly.

