import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from './useWeb3';
import { useWatchedTokens } from './useWatchedTokens';
import { useTokenMetadataCache } from './useTokenMetadataCache';
import { encodeCall } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';
import { decodeTokenSymbol } from '@/lib/evmAbiText';

const BSC_CHAIN_ID = 56;

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
}

interface WalletBalancesResult {
  bnbBalance: string;
  bnbBalanceRaw: bigint;
  tokenBalances: TokenBalance[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPaused: boolean;
  togglePause: () => void;
  lastUpdated: Date | null;
  liveUpdatesEnabled: boolean;
  setLiveUpdatesEnabled: (enabled: boolean) => void;
}

/**
 * Hook for fetching BNB and watched-token balances from the connected wallet address
 * Automatically fetches on wallet connect/account/chain changes
 * BSC-only blocking, polling support, partial-failure resilience
 */
export function useWalletBalances(): WalletBalancesResult {
  const { account, chainId, callContract, getNativeBalance } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { get: getMetadata, set: setMetadata } = useTokenMetadataCache();

  const [bnbBalance, setBnbBalance] = useState('0.0000');
  const [bnbBalanceRaw, setBnbBalanceRaw] = useState(0n);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track previous state to detect meaningful changes
  const prevAccountRef = useRef<string | null>(null);
  const prevChainIdRef = useRef<number | null>(null);
  const prevWatchedTokensRef = useRef<string[]>([]);

  const isOnBSC = chainId === BSC_CHAIN_ID;
  const isReady = !!account && isOnBSC;

  const fetchBalances = async (isManualRefresh = false) => {
    if (!isReady || (isPaused && !isManualRefresh) || (!liveUpdatesEnabled && !isManualRefresh)) return;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch BNB balance
      const bnbRaw = await getNativeBalance(account);
      const bnbFormatted = formatUnits(bnbRaw, 18);
      setBnbBalanceRaw(bnbRaw);
      setBnbBalance(bnbFormatted);

      // Fetch token balances
      const balances: TokenBalance[] = [];

      for (const tokenAddress of watchedTokens) {
        try {
          // Check metadata cache first
          let metadata = getMetadata(tokenAddress);

          // If not cached, fetch metadata
          if (!metadata) {
            const [symbolResult, decimalsResult] = await Promise.allSettled([
              callContract(tokenAddress, encodeCall('symbol')),
              callContract(tokenAddress, encodeCall('decimals')),
            ]);

            const symbol = symbolResult.status === 'fulfilled'
              ? decodeTokenSymbol(symbolResult.value, '')
              : '';

            const decimals = decimalsResult.status === 'fulfilled' && decimalsResult.value !== '0x'
              ? parseInt(decimalsResult.value, 16)
              : 18;

            // Validate decimals range
            const validDecimals = decimals >= 0 && decimals <= 77 ? decimals : 18;

            // Ensure symbol is non-empty
            const validSymbol = symbol && symbol.trim() ? symbol : 'TOKEN';

            metadata = {
              symbol: validSymbol,
              decimals: validDecimals,
            };

            // Cache for future use
            setMetadata(tokenAddress, metadata);
          }

          // Fetch balance
          const balanceData = encodeCall('balanceOf', [
            { type: 'address', value: account },
          ]);
          const balanceResult = await callContract(tokenAddress, balanceData);
          const balanceRaw = balanceResult && balanceResult !== '0x'
            ? BigInt(balanceResult)
            : 0n;

          const balanceFormatted = formatUnits(balanceRaw, metadata.decimals);

          balances.push({
            address: tokenAddress,
            balance: balanceFormatted,
            balanceRaw,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
          });
        } catch (tokenError: any) {
          console.warn(`Failed to fetch balance for token ${tokenAddress}:`, tokenError);
          // Continue with other tokens
        }
      }

      setTokenBalances(balances);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching wallet balances:', err);
      setError(err.message || 'Failed to fetch wallet balances');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleRefetch = async () => {
    await fetchBalances(true);
  };

  // Effect: Fetch on meaningful state changes
  useEffect(() => {
    const accountChanged = prevAccountRef.current !== account;
    const chainChanged = prevChainIdRef.current !== chainId;
    const tokensChanged = JSON.stringify(prevWatchedTokensRef.current) !== JSON.stringify(watchedTokens);

    if (accountChanged || chainChanged || tokensChanged) {
      prevAccountRef.current = account;
      prevChainIdRef.current = chainId;
      prevWatchedTokensRef.current = watchedTokens;

      if (isReady && !isPaused && liveUpdatesEnabled) {
        fetchBalances();
      }
    }
  }, [account, chainId, watchedTokens, isReady, isPaused, liveUpdatesEnabled]);

  // Effect: Polling (every 30 seconds)
  useEffect(() => {
    if (!isReady || isPaused || !liveUpdatesEnabled) return;

    const interval = setInterval(() => {
      fetchBalances();
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, isPaused, liveUpdatesEnabled, watchedTokens]);

  return {
    bnbBalance,
    bnbBalanceRaw,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch: handleRefetch,
    isPaused,
    togglePause,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
  };
}
