# Specification

## Summary
**Goal:** Fix vault BNB balance visibility across tabs, improve token selector dropdown readability/layering, and make wallet-connect UX and messaging work for any injected EIP-1193 wallet (not MetaMask-only).

**Planned changes:**
- Update the vault BNB balance fetching/display so it loads and updates on Deposit and Withdraw tabs (with clear loading/error UI states) without relying on the Balances tab being mounted.
- Adjust Token Contract Address dropdown styling in Deposit and Withdraw Token so the opened menu is fully opaque, renders above inputs (z-index/stacking), and remains readable in light/dark themes.
- Update wallet-connect flow to be wallet-agnostic and work with any injected `window.ethereum` provider; revise user-facing copy to mention example wallets and add mobile guidance to open the dApp in an in-wallet browser when no provider is detected (while keeping the MetaMask link as an option).

**User-visible outcome:** Users see the current vault BNB balance while on Deposit or Withdraw, the token selector dropdown is clearly readable and no longer blends with the Amount field, and the app can connect using injected wallets beyond MetaMask with clearer, wallet-agnostic guidance.
