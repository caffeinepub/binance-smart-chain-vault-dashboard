import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from './useWeb3';
import { useWatchedTokens } from './useWatchedTokens';
import { useTokenMetadataCache } from './useTokenMetadataCache';
import { VAULT_ADDRESS, encodeCall } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';
import { decodeTokenSymbol } from '@/lib/evmAbiText';

const BSC_CHAIN_ID = 56;

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
  error?: string;
  usedFallback?: boolean;
}

interface VaultBalancesResult {
  bnbBalance: string;
  bnbBalanceRaw: bigint;
  bnbError: string | null;
  bnbFallbackUsed: boolean;
  tokenBalances: TokenBalance[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPaused: boolean;
  togglePause: () => void;
  usedNativeFallback: boolean;
  lastUpdated: Date | null;
  liveUpdatesEnabled: boolean;
  setLiveUpdatesEnabled: (enabled: boolean) => void;
  clearMetadataCache: () => void;
  metadataCacheSize: number;
  hasWatchedTokens: boolean;
  tokenErrorCount: number;
}

/**
 * Hook for fetching BNB and token balances with native balance fallback
 * Stabilized effect triggering using previous-state refs
 */
export function useVaultBalances(): VaultBalancesResult {
  const { account, chainId, callContract, getNativeBalance } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { get: getMetadata, set: setMetadata, clear: clearCache, cacheSize } = useTokenMetadataCache();

  const [bnbBalance, setBnbBalance] = useState('0.0000');
  const [bnbBalanceRaw, setBnbBalanceRaw] = useState(0n);
  const [bnbError, setBnbError] = useState<string | null>(null);
  const [bnbFallbackUsed, setBnbFallbackUsed] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [usedNativeFallback, setUsedNativeFallback] = useState(false);
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
    setBnbError(null);
    setUsedNativeFallback(false);
    setBnbFallbackUsed(false);

    try {
      // Try contract bnbBalance first
      let bnbRaw: bigint;
      try {
        const bnbResult = await callContract(
          VAULT_ADDRESS,
          encodeCall('bnbBalance')
        );
        bnbRaw = bnbResult && bnbResult !== '0x' ? BigInt(bnbResult) : 0n;
      } catch (contractError) {
        console.warn('Contract bnbBalance failed, using native balance fallback:', contractError);
        bnbRaw = await getNativeBalance(VAULT_ADDRESS);
        setUsedNativeFallback(true);
        setBnbFallbackUsed(true);
      }

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

          // Fetch balance from vault - with fallback to ERC20 balanceOf
          let balanceRaw: bigint;
          let usedFallback = false;
          let balanceError: string | undefined;

          try {
            // Try vault's tokenBalance method first
            const balanceData = encodeCall('tokenBalance', [
              { type: 'address', value: tokenAddress },
            ]);
            const balanceResult = await callContract(VAULT_ADDRESS, balanceData);
            balanceRaw = balanceResult && balanceResult !== '0x'
              ? BigInt(balanceResult)
              : 0n;
          } catch (vaultError) {
            console.warn(`Vault tokenBalance failed for ${tokenAddress}, trying ERC20 balanceOf fallback:`, vaultError);
            
            try {
              // Fallback: call balanceOf(vaultAddress) on the token contract
              const balanceOfData = encodeCall('balanceOf', [
                { type: 'address', value: VAULT_ADDRESS },
              ]);
              const balanceResult = await callContract(tokenAddress, balanceOfData);
              balanceRaw = balanceResult && balanceResult !== '0x'
                ? BigInt(balanceResult)
                : 0n;
              usedFallback = true;
            } catch (fallbackError) {
              console.error(`Both vault and ERC20 balance fetch failed for ${tokenAddress}:`, fallbackError);
              // Set balance to 0 and mark error
              balanceRaw = 0n;
              balanceError = 'Balance unavailable';
            }
          }

          const balanceFormatted = formatUnits(balanceRaw, metadata.decimals);

          balances.push({
            address: tokenAddress,
            balance: balanceFormatted,
            balanceRaw,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            error: balanceError,
            usedFallback,
          });
        } catch (tokenError: any) {
          console.warn(`Failed to process token ${tokenAddress}:`, tokenError);
          // Still add the token with error state
          balances.push({
            address: tokenAddress,
            balance: '0.0000',
            balanceRaw: 0n,
            symbol: 'TOKEN',
            decimals: 18,
            error: 'Failed to load',
          });
        }
      }

      setTokenBalances(balances);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching vault balances:', err);
      setError(err.message || 'Failed to fetch vault balances');
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

  const clearMetadataCache = () => {
    clearCache();
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

  const tokenErrorCount = tokenBalances.filter(t => t.error).length;

  return {
    bnbBalance,
    bnbBalanceRaw,
    bnbError,
    bnbFallbackUsed,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch: handleRefetch,
    isPaused,
    togglePause,
    usedNativeFallback,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
    clearMetadataCache,
    metadataCacheSize: cacheSize,
    hasWatchedTokens: watchedTokens.length > 0,
    tokenErrorCount,
  };
}
