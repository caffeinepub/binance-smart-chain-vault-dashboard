import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, decodeUint256 } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';
import { useWatchedTokens } from './useWatchedTokens';
import { decodeTokenSymbol } from '@/lib/evmAbiText';
import { useTokenMetadataCache } from './useTokenMetadataCache';

const POLL_INTERVAL = 10000; // 10 seconds

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
}

export function useVaultBalances(enablePolling = true) {
  const { callContract, isConnected } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { get: getMetadata, set: setMetadata, cacheSize, clear: clearCache } = useTokenMetadataCache();

  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [bnbBalanceRaw, setBnbBalanceRaw] = useState<bigint>(0n);
  const [bnbError, setBnbError] = useState<string | null>(null);
  const [bnbFallbackUsed, setBnbFallbackUsed] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);

  const fetchBnbBalance = useCallback(async () => {
    if (!isConnected) return;

    try {
      setBnbError(null);
      setBnbFallbackUsed(false);

      const balanceHex = await callContract(
        VAULT_ADDRESS,
        '0x12065fe0' // getBalance()
      );

      const balance = decodeUint256(balanceHex);
      const formatted = formatUnits(balance, 18);

      setBnbBalanceRaw(balance);
      setBnbBalance(formatted);
    } catch (err: any) {
      console.error('Failed to fetch BNB balance:', err);
      setBnbError(err.message || 'Failed to fetch BNB balance');
      setBnbBalance('0');
      setBnbBalanceRaw(0n);
    }
  }, [callContract, isConnected]);

  const fetchTokenMetadata = useCallback(
    async (tokenAddress: string): Promise<{ symbol: string; decimals: number }> => {
      // Check cache first
      const cached = getMetadata(tokenAddress);
      if (cached) {
        return cached;
      }

      try {
        // Fetch symbol
        const symbolData = await callContract(tokenAddress, '0x95d89b41');
        const symbol = decodeTokenSymbol(symbolData, 'TOKEN');

        // Fetch decimals
        const decimalsData = await callContract(tokenAddress, '0x313ce567');
        const decimals = parseInt(decimalsData, 16);

        const metadata = { symbol, decimals };
        setMetadata(tokenAddress, metadata);
        return metadata;
      } catch (err) {
        console.error(`Failed to fetch metadata for ${tokenAddress}:`, err);
        return { symbol: 'UNKNOWN', decimals: 18 };
      }
    },
    [callContract, getMetadata, setMetadata]
  );

  const fetchTokenBalances = useCallback(async () => {
    if (!isConnected || watchedTokens.length === 0) {
      setTokenBalances([]);
      return;
    }

    try {
      const balances = await Promise.all(
        watchedTokens.map(async (tokenAddress) => {
          try {
            // Fetch balance
            const balanceData = await callContract(
              tokenAddress,
              '0x70a08231' + VAULT_ADDRESS.slice(2).padStart(64, '0') // balanceOf(address)
            );
            const balanceRaw = decodeUint256(balanceData);

            // Fetch metadata (with caching)
            const { symbol, decimals } = await fetchTokenMetadata(tokenAddress);

            const balance = formatUnits(balanceRaw, decimals);

            return {
              address: tokenAddress,
              symbol,
              balance,
              balanceRaw,
              decimals,
            };
          } catch (err) {
            console.error(`Failed to fetch balance for ${tokenAddress}:`, err);
            return null;
          }
        })
      );

      setTokenBalances(balances.filter((b): b is TokenBalance => b !== null));
    } catch (err: any) {
      console.error('Failed to fetch token balances:', err);
      setError(err.message || 'Failed to fetch token balances');
    }
  }, [callContract, isConnected, watchedTokens, fetchTokenMetadata]);

  const fetchAllBalances = useCallback(
    async (isInitial = false) => {
      if (!isConnected) {
        setIsLoading(false);
        return;
      }

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        await Promise.all([fetchBnbBalance(), fetchTokenBalances()]);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Failed to fetch balances:', err);
        setError(err.message || 'Failed to fetch balances');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isConnected, fetchBnbBalance, fetchTokenBalances]
  );

  // Initial fetch - only when connected
  useEffect(() => {
    if (isConnected) {
      fetchAllBalances(true);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, fetchAllBalances]);

  // Polling - only when enabled and connected
  useEffect(() => {
    if (!liveUpdatesEnabled || !isConnected || !enablePolling) return;

    const interval = setInterval(() => {
      fetchAllBalances(false);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [liveUpdatesEnabled, isConnected, enablePolling, fetchAllBalances]);

  const clearMetadataCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  return {
    bnbBalance,
    bnbBalanceRaw,
    bnbError,
    bnbFallbackUsed,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchAllBalances(false),
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
    clearMetadataCache,
    metadataCacheSize: cacheSize,
  };
}
