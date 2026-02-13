# Specification

## Summary
**Goal:** Fix draft/preview blank screen crashes by ensuring Web3 context is available and adding a safe, user-friendly crash fallback.

**Planned changes:**
- Wrap the React app with the existing `Web3Provider` so components using `useWeb3()` have required context during initial render.
- Add a runtime error fallback UI that shows a readable English error message and a clear recovery action (reload) when an uncaught render-time exception occurs.

**User-visible outcome:** Opening the draft/preview no longer crashes to a blank screen; users see the normal dashboard loading/connect UI, and if an unexpected error occurs they see a friendly error screen with a reload option.
