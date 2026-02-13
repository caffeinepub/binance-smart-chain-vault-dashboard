import { useState, useEffect } from 'react';

interface TokenMetadata {
  symbol: string;
  decimals: number;
  name?: string;
}

const CACHE_KEY = 'vault_token_metadata_cache';
const CACHE_VERSION = 'v1';

interface CacheEntry {
  version: string;
  data: Record<string, TokenMetadata>;
}

/**
 * Hook for caching token metadata (symbol, decimals, name) per address
 * Persists to localStorage to avoid repeated RPC calls across sessions
 */
export function useTokenMetadataCache() {
  const [cache, setCache] = useState<Record<string, TokenMetadata>>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed: CacheEntry = JSON.parse(stored);
        if (parsed.version === CACHE_VERSION) {
          return parsed.data;
        }
      }
    } catch (err) {
      console.warn('Failed to load token metadata cache:', err);
    }
    return {};
  });

  // Persist cache to localStorage whenever it changes
  useEffect(() => {
    try {
      const entry: CacheEntry = {
        version: CACHE_VERSION,
        data: cache,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch (err) {
      console.warn('Failed to persist token metadata cache:', err);
    }
  }, [cache]);

  const get = (address: string): TokenMetadata | undefined => {
    const normalized = address.toLowerCase();
    return cache[normalized];
  };

  const set = (address: string, metadata: TokenMetadata) => {
    const normalized = address.toLowerCase();
    setCache(prev => ({
      ...prev,
      [normalized]: metadata,
    }));
  };

  const clear = () => {
    setCache({});
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (err) {
      console.warn('Failed to clear token metadata cache:', err);
    }
  };

  const clearToken = (address: string) => {
    const normalized = address.toLowerCase();
    setCache(prev => {
      const next = { ...prev };
      delete next[normalized];
      return next;
    });
  };

  return {
    get,
    set,
    clear,
    clearToken,
    cacheSize: Object.keys(cache).length,
  };
}
