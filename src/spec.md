# Specification

## Summary
**Goal:** Rename the app branding to “Digital Asset Vault” and add a local Deposit/Withdrawal transaction history with status tracking.

**Planned changes:**
- Update dashboard/hero copy to display the main title exactly “Digital Asset Vault” and remove the subtitle “Professional-grade asset management on Binance Smart Chain”.
- Update header brand text to “Digital Asset Vault” (including a sensible short/mobile variant if needed) and ensure it no longer shows “Vault Dashboard”.
- Add a “Deposit & Withdrawal History” control associated with the Deposit and Withdraw areas to access a history view.
- Record deposits/withdrawals initiated from the dApp into a locally persisted history list (survives refresh) including: operation type, asset (BNB or token label/address if available), amount, timestamp, and tx hash (short display acceptable).
- Display and update per-transaction status over time (Pending → Confirmed; Failed on revert/failure) without introducing backend storage or real-time WebSocket updates.
- Provide history management actions: open tx hash on BscScan in a new tab/window, and a “Clear History” action with a safe confirmation step.

**User-visible outcome:** Users see updated “Digital Asset Vault” branding and can open a Deposit & Withdrawal History view from the deposit/withdraw flows to track submitted transactions (with status), open them on BscScan, and clear the locally stored history.
