import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from './useWeb3';
import { encodeCall, decodeResult } from '@/lib/contracts';
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

export function useWalletBalances(enablePolling = true) {
  const { callContract, getNativeBalance, isConnected, chainId, account } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { get: getMetadata, set: setMetadata } = useTokenMetadataCache();

  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [bnbBalanceRaw, setBnbBalanceRaw] = useState<bigint>(0n);
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
  const prevConnectionStateRef = useRef<{ isConnected: boolean; chainId: number | null; account: string | null }>({
    isConnected: false,
    chainId: null,
    account: null,
  });

  // Check if on correct network - treat null as "detecting" not "wrong"
  const isOnBSC = chainId === BSC_CHAIN_ID;
  const isDetectingNetwork = chainId === null && isConnected;

  const fetchBnbBalance = useCallback(async () => {
    if (!isConnected || !isOnBSC || !account) return;

    try {
      const nativeBalance = await withTimeout(
        getNativeBalance(account),
        FETCH_TIMEOUT,
        'Native balance fetch timed out'
      );
      
      const formatted = formatUnits(nativeBalance, 18);
      
      setBnbBalanceRaw(nativeBalance);
      setBnbBalance(formatted);
      
      // Store successful result
      lastSuccessfulBnbRef.current = { balance: formatted, balanceRaw: nativeBalance };
    } catch (err: any) {
      console.error('Failed to fetch wallet BNB balance:', err);
      
      // Keep last known balance instead of resetting to 0
      if (lastSuccessfulBnbRef.current.balance !== '0') {
        setBnbBalance(lastSuccessfulBnbRef.current.balance);
        setBnbBalanceRaw(lastSuccessfulBnbRef.current.balanceRaw);
      }
      throw err;
    }
  }, [isConnected, isOnBSC, account, getNativeBalance]);

  const fetchTokenBalances = useCallback(async () => {
    if (!isConnected || !isOnBSC || !account) return;

    const balances: TokenBalance[] = [];
    const errors: string[] = [];

    for (const tokenAddress of watchedTokens) {
      try {
        // Check cache first
        let metadata = getMetadata(tokenAddress);

        // Fetch metadata if not cached
        if (!metadata) {
          const symbolCallData = encodeCall('symbol');
          const decimalsCallData = encodeCall('decimals');

          const [symbolHex, decimalsHex] = await Promise.all([
            withTimeout(
              callContract(tokenAddress, symbolCallData),
              FETCH_TIMEOUT,
              'Symbol fetch timed out'
            ),
            withTimeout(
              callContract(tokenAddress, decimalsCallData),
              FETCH_TIMEOUT,
              'Decimals fetch timed out'
            ),
          ]);

          const symbol = decodeTokenSymbol(symbolHex);
          // Decimals is uint8, but we decode as uint256 and convert to number
          const decimals = Number(decodeResult(decimalsHex, 'uint256'));

          metadata = { symbol, decimals };
          setMetadata(tokenAddress, metadata);
        }

        // Fetch balance using balanceOf(account)
        const balanceOfCallData = encodeCall('balanceOf', [
          { type: 'address', value: account }
        ]);
        const balanceHex = await withTimeout(
          callContract(tokenAddress, balanceOfCallData),
          FETCH_TIMEOUT,
          'Balance fetch timed out'
        );

        const balanceRaw = decodeResult(balanceHex, 'uint256') as bigint;
        const balance = formatUnits(balanceRaw, metadata.decimals);

        balances.push({
          address: tokenAddress,
          symbol: metadata.symbol,
          balance,
          balanceRaw,
          decimals: metadata.decimals,
        });
      } catch (err: any) {
        console.error(`Failed to fetch balance for token ${tokenAddress}:`, err);
        errors.push(`${tokenAddress}: ${err.message}`);
        // Continue with other tokens
      }
    }

    setTokenBalances(balances);
    lastSuccessfulTokensRef.current = balances;

    if (errors.length > 0 && balances.length === 0) {
      throw new Error(`Failed to fetch any token balances: ${errors.join('; ')}`);
    }
  }, [isConnected, isOnBSC, account, watchedTokens, callContract, getMetadata, setMetadata]);

  const fetchAllBalances = useCallback(async () => {
    // Coalesce concurrent calls
    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        setError(null);

        await Promise.all([
          fetchBnbBalance(),
          fetchTokenBalances(),
        ]);

        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Error fetching wallet balances:', err);
        setError(err.message || 'Failed to fetch wallet balances');
      } finally {
        inFlightFetchRef.current = null;
      }
    })();

    inFlightFetchRef.current = fetchPromise;
    return fetchPromise;
  }, [fetchBnbBalance, fetchTokenBalances]);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAllBalances();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllBalances]);

  // Initial fetch and auto-fetch on connection/network/account changes
  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    const currentState = { isConnected, chainId, account };

    // Detect meaningful state transitions
    const justConnected = !prevState.isConnected && isConnected;
    const networkChanged = prevState.chainId !== chainId && chainId !== null;
    const accountChanged = prevState.account !== account && account !== null;
    const nowOnBSC = !isDetectingNetwork && isOnBSC;

    prevConnectionStateRef.current = currentState;

    // Block fetch if not on BSC
    if (isConnected && chainId !== null && !isOnBSC) {
      setError('Please switch to Binance Smart Chain (BSC) to view wallet balances');
      setIsLoading(false);
      return;
    }

    // Skip if still detecting network
    if (isDetectingNetwork) {
      return;
    }

    // Fetch on meaningful transitions
    if (nowOnBSC && (justConnected || networkChanged || accountChanged)) {
      setIsLoading(true);
      fetchAllBalances().finally(() => setIsLoading(false));
    }
  }, [isConnected, chainId, account, isOnBSC, isDetectingNetwork, fetchAllBalances]);

  // Polling effect
  useEffect(() => {
    if (!enablePolling || !liveUpdatesEnabled || !isConnected || !isOnBSC || isDetectingNetwork) {
      return;
    }

    const interval = setInterval(() => {
      fetchAllBalances();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [enablePolling, liveUpdatesEnabled, isConnected, isOnBSC, isDetectingNetwork, fetchAllBalances]);

  return {
    bnbBalance,
    bnbBalanceRaw,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
  };
}
