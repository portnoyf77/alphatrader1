

# Fix Build Errors: NodeJS Namespace

Two files reference `NodeJS.Timeout` which isn't available without `@types/node`. The fix is to use `ReturnType<typeof setTimeout>` instead.

## Changes

1. **`src/components/strategy-creation/GemRefinementAnimation.tsx` (line 55):** Change `NodeJS.Timeout` to `ReturnType<typeof setTimeout>`
2. **`src/components/strategy-creation/ParticleCrystallizationAnimation.tsx` (line 65):** Change `NodeJS.Timeout` to `ReturnType<typeof setTimeout>`

