# Specification

## Summary
**Goal:** Fix the Dashboard so wallet connection/wrong-network guidance is always visible when needed, and prevent Vault Balances from getting stuck in an infinite refresh/loading state.

**Planned changes:**
- Update the Dashboard rendering logic to always show the existing WalletConnect UI when (a) no wallet is connected or (b) the connected wallet is on a non-BSC network (chainId != 56), and hide/disable balances and vault operation panels until on BSC Mainnet.
- Adjust Vault Balances fetching/refresh behavior to skip polling/refresh when chainId != 56 and show a clear English error instructing the user to switch to BSC.
- Harden Vault Balances refresh/polling state management so `isRefreshing` cannot remain true indefinitely, overlapping fetches are handled safely, and stalled RPC calls time out into a visible error state.

**User-visible outcome:** On the Dashboard, users always see a Connect Wallet button when disconnected, see a Wrong Network prompt (with switch-to-BSC action) when connected to the wrong chain, and Vault Balances no longer spins forever—balances display when available or a clear error appears within a bounded time.
