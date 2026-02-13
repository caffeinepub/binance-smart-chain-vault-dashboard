# Specification

## Summary
**Goal:** Stabilize live vault balance updates so they don’t cause refresh loops, keep Wallet Connect consistently accessible, and display vault balances token-wise.

**Planned changes:**
- Fix live balance polling/data-fetch to avoid repeated refresh/re-render loops, coalesce overlapping fetches, and prevent state resets that hide/disrupt Wallet Connect.
- Add a safe error state for failed balance fetches (e.g., timeout/RPC errors) with a manual retry, without making the app unusable.
- Move the Wallet Connect entry point to the top area of the Dashboard so it’s always visible without scrolling; show connection status instead of a primary connect CTA when already connected.
- Update the vault balances UI to a clear token-wise list/table showing BNB and other tokens as separate rows with token labels (symbols) and balances, including a clear empty/only-BNB state.

**User-visible outcome:** The dashboard no longer appears to “refresh” in a loop during live updates, Wallet Connect is always available at the top when needed, and users can see vault balances broken down by token (BNB and other tokens) in a stable, readable list.
