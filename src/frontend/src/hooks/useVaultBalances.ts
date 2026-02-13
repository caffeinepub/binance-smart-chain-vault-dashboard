import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, decodeUint256 } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';
import { useWatchedTokens } from './useWatchedTokens';
import { decodeTokenSymbol } from '@/lib/evmAbiText';
import { useTokenMetadataCache } from './useTokenMetadataCache';

const POLL_INTERVAL = 10000; // 10 seconds
const FETCH_TIMEOUT = 15000; // 15 seconds timeout for RPC calls
const BSC_CHAIN_ID = 56;

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export function useVaultBalances(enablePolling = true) {
  const { callContract, isConnected, chainId } = useWeb3();
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

  // In-flight guard to prevent overlapping fetches
  const isFetchingRef = useRef(false);

  // Check if on correct network
  const isOnBSC = chainId === BSC_CHAIN_ID;

  const fetchBnbBalance = useCallback(async () => {
    if (!isConnected || !isOnBSC) return;

    try {
      setBnbError(null);
      setBnbFallbackUsed(false);

      const balanceHex = await withTimeout(
        callContract(VAULT_ADDRESS, '0x12065fe0'), // getBalance()
        FETCH_TIMEOUT,
        'Request timed out. Please check your network connection and try again.'
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
      throw err; // Re-throw to be caught by fetchAllBalances
    }
  }, [callContract, isConnected, isOnBSC]);

  const fetchTokenMetadata = useCallback(
    async (tokenAddress: string): Promise<{ symbol: string; decimals: number }> => {
      // Check cache first
      const cached = getMetadata(tokenAddress);
      if (cached) {
        return cached;
      }

      try {
        // Fetch symbol with timeout
        const symbolData = await withTimeout(
          callContract(tokenAddress, '0x95d89b41'),
          FETCH_TIMEOUT,
          'Token metadata fetch timed out'
        );
        const symbol = decodeTokenSymbol(symbolData, 'TOKEN');

        // Fetch decimals with timeout
        const decimalsData = await withTimeout(
          callContract(tokenAddress, '0x313ce567'),
          FETCH_TIMEOUT,
          'Token decimals fetch timed out'
        );
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
    if (!isConnected || !isOnBSC || watchedTokens.length === 0) {
      setTokenBalances([]);
      return;
    }

    try {
      const balances = await Promise.all(
        watchedTokens.map(async (tokenAddress) => {
          try {
            // Fetch balance with timeout
            const balanceData = await withTimeout(
              callContract(
                tokenAddress,
                '0x70a08231' + VAULT_ADDRESS.slice(2).padStart(64, '0') // balanceOf(address)
              ),
              FETCH_TIMEOUT,
              'Token balance fetch timed out'
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

      const validBalances = balances.filter((b): b is TokenBalance => b !== null);
      setTokenBalances(validBalances);

      // If some balances failed but not all, don't throw
      if (validBalances.length === 0 && watchedTokens.length > 0) {
        throw new Error('Failed to fetch any token balances');
      }
    } catch (err: any) {
      console.error('Failed to fetch token balances:', err);
      throw err; // Re-throw to be caught by fetchAllBalances
    }
  }, [callContract, isConnected, isOnBSC, watchedTokens, fetchTokenMetadata]);

  const fetchAllBalances = useCallback(
    async (isInitial = false) => {
      // Prevent overlapping fetches
      if (isFetchingRef.current) {
        return;
      }

      // Check if on correct network
      if (!isConnected) {
        setIsLoading(false);
        setIsRefreshing(false);
        setError(null);
        return;
      }

      if (!isOnBSC) {
        setIsLoading(false);
        setIsRefreshing(false);
        setError('Please switch to Binance Smart Chain (BSC) network to view balances.');
        return;
      }

      isFetchingRef.current = true;

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        await Promise.all([fetchBnbBalance(), fetchTokenBalances()]);
        setLastUpdated(new Date());
        setError(null); // Clear any previous errors on success
      } catch (err: any) {
        console.error('Failed to fetch balances:', err);
        const errorMessage = err.message || 'Failed to fetch balances. Please check your network connection and try again.';
        setError(errorMessage);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isConnected, isOnBSC, fetchBnbBalance, fetchTokenBalances]
  );

  // Initial fetch - only when connected and on BSC
  useEffect(() => {
    if (isConnected && isOnBSC) {
      fetchAllBalances(true);
    } else {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
      
      if (isConnected && !isOnBSC) {
        setError('Please switch to Binance Smart Chain (BSC) network to view balances.');
      } else {
        setError(null);
      }
    }
  }, [isConnected, isOnBSC, fetchAllBalances]);

  // Polling - only when enabled, connected, and on BSC
  useEffect(() => {
    if (!liveUpdatesEnabled || !isConnected || !isOnBSC || !enablePolling) return;

    const interval = setInterval(() => {
      fetchAllBalances(false);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [liveUpdatesEnabled, isConnected, isOnBSC, enablePolling, fetchAllBalances]);

  // Reset states when disconnected or wrong network
  useEffect(() => {
    if (!isConnected || !isOnBSC) {
      setIsRefreshing(false);
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isConnected, isOnBSC]);

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
