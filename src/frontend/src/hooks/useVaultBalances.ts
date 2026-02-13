import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, encodeCall, decodeResult } from '@/lib/contracts';
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
  const { callContract, getNativeBalance, isConnected, chainId } = useWeb3();
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

  // Track in-flight fetch promise for coalescing
  const inFlightFetchRef = useRef<Promise<void> | null>(null);
  
  // Keep last successful balances to avoid resetting on errors
  const lastSuccessfulBnbRef = useRef<{ balance: string; balanceRaw: bigint }>({ balance: '0', balanceRaw: 0n });
  const lastSuccessfulTokensRef = useRef<TokenBalance[]>([]);

  // Track previous connection state to detect transitions
  const prevConnectionStateRef = useRef<{ isConnected: boolean; chainId: number | null }>({
    isConnected: false,
    chainId: null,
  });

  // Check if on correct network - treat null as "detecting" not "wrong"
  const isOnBSC = chainId === BSC_CHAIN_ID;
  const isDetectingNetwork = chainId === null && isConnected;

  const fetchBnbBalance = useCallback(async () => {
    if (!isConnected || !isOnBSC) return;

    try {
      setBnbError(null);
      setBnbFallbackUsed(false);

      // Try contract method first
      const callData = encodeCall('bnbBalance');
      
      try {
        const balanceHex = await withTimeout(
          callContract(VAULT_ADDRESS, callData),
          FETCH_TIMEOUT,
          'Request timed out. Please check your network connection and try again.'
        );

        const balance = decodeResult(balanceHex, 'uint256') as bigint;
        const formatted = formatUnits(balance, 18);

        setBnbBalanceRaw(balance);
        setBnbBalance(formatted);
        
        // Store successful result
        lastSuccessfulBnbRef.current = { balance: formatted, balanceRaw: balance };
      } catch (contractError: any) {
        // Contract call failed, try native balance fallback
        console.warn('Contract bnbBalance call failed, using native balance fallback:', contractError);
        
        const nativeBalance = await withTimeout(
          getNativeBalance(VAULT_ADDRESS),
          FETCH_TIMEOUT,
          'Native balance fetch timed out'
        );
        
        const formatted = formatUnits(nativeBalance, 18);
        
        setBnbBalanceRaw(nativeBalance);
        setBnbBalance(formatted);
        setBnbFallbackUsed(true);
        
        // Store successful result
        lastSuccessfulBnbRef.current = { balance: formatted, balanceRaw: nativeBalance };
      }
    } catch (err: any) {
      console.error('Failed to fetch BNB balance:', err);
      const errorMsg = err.message || 'Failed to fetch BNB balance';
      setBnbError(errorMsg);
      
      // Keep last known balance instead of resetting to 0
      if (lastSuccessfulBnbRef.current.balance !== '0') {
        setBnbBalance(lastSuccessfulBnbRef.current.balance);
        setBnbBalanceRaw(lastSuccessfulBnbRef.current.balanceRaw);
      }
      
      throw err; // Re-throw to be caught by fetchAllBalances
    }
  }, [callContract, getNativeBalance, isConnected, isOnBSC]);

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
        
        // Decode decimals properly as uint8 (still returned as uint256 in ABI)
        const decimalsRaw = decodeResult(decimalsData, 'uint256') as bigint;
        const decimals = Number(decimalsRaw);

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
      lastSuccessfulTokensRef.current = [];
      return;
    }

    try {
      const balances = await Promise.all(
        watchedTokens.map(async (tokenAddress) => {
          try {
            // Use encodeCall for proper parameter encoding
            const callData = encodeCall('balanceOf', [
              { type: 'address', value: VAULT_ADDRESS }
            ]);
            
            // Fetch balance with timeout
            const balanceData = await withTimeout(
              callContract(tokenAddress, callData),
              FETCH_TIMEOUT,
              'Token balance fetch timed out'
            );
            
            const balanceRaw = decodeResult(balanceData, 'uint256') as bigint;

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
            
            // Try to preserve last known balance for this specific token
            const lastKnown = lastSuccessfulTokensRef.current.find(
              t => t.address.toLowerCase() === tokenAddress.toLowerCase()
            );
            
            return lastKnown || null;
          }
        })
      );

      const validBalances = balances.filter((b): b is TokenBalance => b !== null);
      setTokenBalances(validBalances);
      
      // Merge with last successful to preserve balances for tokens that succeeded
      const mergedBalances = [...validBalances];
      for (const lastToken of lastSuccessfulTokensRef.current) {
        if (!mergedBalances.find(t => t.address.toLowerCase() === lastToken.address.toLowerCase())) {
          mergedBalances.push(lastToken);
        }
      }
      
      lastSuccessfulTokensRef.current = mergedBalances;

      // If some balances failed but not all, don't throw
      if (validBalances.length === 0 && watchedTokens.length > 0) {
        throw new Error('Failed to fetch any token balances');
      }
    } catch (err: any) {
      console.error('Failed to fetch token balances:', err);
      
      // Keep last known token balances on error
      if (lastSuccessfulTokensRef.current.length > 0) {
        setTokenBalances(lastSuccessfulTokensRef.current);
      }
      
      throw err; // Re-throw to be caught by fetchAllBalances
    }
  }, [callContract, isConnected, isOnBSC, watchedTokens, fetchTokenMetadata]);

  // Create a stable fetch function using refs to avoid dependency churn
  const fetchAllBalancesRef = useRef<((isInitial: boolean) => Promise<void>) | null>(null);
  
  fetchAllBalancesRef.current = async (isInitial = false) => {
    // Don't fetch if not connected
    if (!isConnected) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }

    // If detecting network, show loading but don't error
    if (isDetectingNetwork) {
      if (isInitial) {
        setIsLoading(true);
      }
      setError(null);
      return;
    }

    // If on wrong network, set error but don't reset balances
    if (!isOnBSC) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError('Please switch to Binance Smart Chain (BSC) network');
      return;
    }

    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      await Promise.all([fetchBnbBalance(), fetchTokenBalances()]);

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch balances:', err);
      // Set error but keep last known balances visible
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Stable wrapper that calls the ref
  const fetchAllBalances = useCallback((isInitial = false) => {
    if (fetchAllBalancesRef.current) {
      return fetchAllBalancesRef.current(isInitial);
    }
    return Promise.resolve();
  }, []);

  /**
   * Manual refresh with coalescing:
   * - If a fetch is in progress, await it and then trigger a new fetch
   * - This ensures manual refresh always completes with updated data
   */
  const refetch = useCallback(async () => {
    // If there's an in-flight fetch, await it first
    if (inFlightFetchRef.current) {
      try {
        await inFlightFetchRef.current;
      } catch (err) {
        // Ignore errors from the in-flight fetch
      }
    }

    // Now trigger a new fetch
    const fetchPromise = fetchAllBalances(false);
    inFlightFetchRef.current = fetchPromise;

    try {
      await fetchPromise;
    } finally {
      // Clear the in-flight reference when done
      if (inFlightFetchRef.current === fetchPromise) {
        inFlightFetchRef.current = null;
      }
    }
  }, [fetchAllBalances]);

  const clearMetadataCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  // Initial fetch on mount or when connection/chain changes (only on meaningful transitions)
  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    const currentState = { isConnected, chainId };

    // Detect meaningful state transitions
    const justConnected = !prevState.isConnected && isConnected;
    const chainSwitchedToBSC = prevState.chainId !== null && prevState.chainId !== BSC_CHAIN_ID && chainId === BSC_CHAIN_ID;
    const networkDetected = prevState.chainId === null && chainId !== null;

    // Update the ref for next comparison
    prevConnectionStateRef.current = currentState;

    // Only fetch on meaningful transitions or initial mount when already connected to BSC
    if (isConnected && isOnBSC && (justConnected || chainSwitchedToBSC || networkDetected)) {
      const fetchPromise = fetchAllBalances(true);
      inFlightFetchRef.current = fetchPromise;
      fetchPromise.finally(() => {
        if (inFlightFetchRef.current === fetchPromise) {
          inFlightFetchRef.current = null;
        }
      });
    } else if (!isConnected) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError(null);
    } else if (isConnected && !isOnBSC && !isDetectingNetwork) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError('Please switch to Binance Smart Chain (BSC) network');
    }
  }, [isConnected, chainId, isOnBSC, isDetectingNetwork, fetchAllBalances]);

  // Polling effect - only poll when connected, on BSC, and live updates enabled
  useEffect(() => {
    if (!enablePolling || !liveUpdatesEnabled || !isConnected || !isOnBSC) {
      return;
    }

    const interval = setInterval(() => {
      // Only poll if no manual refresh is in progress
      if (!inFlightFetchRef.current) {
        const fetchPromise = fetchAllBalances(false);
        inFlightFetchRef.current = fetchPromise;
        fetchPromise.finally(() => {
          if (inFlightFetchRef.current === fetchPromise) {
            inFlightFetchRef.current = null;
          }
        });
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [enablePolling, liveUpdatesEnabled, isConnected, isOnBSC, fetchAllBalances]);

  return {
    bnbBalance,
    bnbBalanceRaw,
    bnbError,
    bnbFallbackUsed,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
    clearMetadataCache,
    metadataCacheSize: cacheSize,
  };
}
