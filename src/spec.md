# Specification

## Summary
**Goal:** Make wallet connect prompts consistently visible on the Dashboard and ensure vault balances reliably refresh after connect, network/account changes, and manual refresh.

**Planned changes:**
- Adjust Dashboard rendering logic so the WalletConnect UI (or a clear loading state in the same area) is shown whenever the user is disconnected, Web3 is initializing, or the wallet is connected to a non-BSC network (chainId != 56); hide balances/operations panels in wrong-network mode.
- Fix vault balance refresh flow to always resolve (success or error) and to update balances after wallet connect, account change, chain change, and manual refresh; ensure manual refresh does not no-op when a polling fetch is in-flight (await/coalesce and then update state).
- Improve Web3 provider event handling (EIP-1193: accountsChanged, chainChanged, connect, disconnect) to keep account/chainId state in sync, reset state consistently on disconnect/empty accounts, and clean up listeners to avoid console errors.

**User-visible outcome:** Users always see a clear “Connect Wallet” or “Wrong Network” prompt when appropriate, and vault balances load/refresh reliably after connecting, switching accounts/networks, or clicking Refresh—without getting stuck or requiring a hard reload.
