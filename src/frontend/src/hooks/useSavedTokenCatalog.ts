import { useState, useEffect } from 'react';
import { normalizeAddress } from '@/lib/evm';

const STORAGE_KEY = 'bsc-vault-token-catalog';

export interface TokenCatalogEntry {
  address: string; // normalized lowercase 0x format
  label: string;   // user-friendly display name
}

export interface TokenDropdownOption {
  value: string;   // normalized address
  label: string;   // display label
  displayAddress: string; // shortened address for display
}

/**
 * Hook to manage a persistent catalog of saved tokens with user-friendly labels
 * Stored in localStorage, keyed by normalized address
 */
export function useSavedTokenCatalog() {
  const [catalog, setCatalog] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const map = new Map<string, string>();
          for (const entry of parsed) {
            if (entry.address && entry.label) {
              try {
                const normalized = normalizeAddress(entry.address);
                map.set(normalized, entry.label);
              } catch (error) {
                console.warn('Discarding invalid catalog entry:', entry);
              }
            }
          }
          setCatalog(map);
        }
      }
    } catch (error) {
      console.error('Error loading token catalog:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever catalog changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const entries: TokenCatalogEntry[] = Array.from(catalog.entries()).map(
          ([address, label]) => ({ address, label })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.error('Error saving token catalog:', error);
      }
    }
  }, [catalog, isLoading]);

  /**
   * Upsert a token label (add or update)
   */
  const setTokenLabel = (address: string, label: string): void => {
    const normalized = normalizeAddress(address);
    const trimmedLabel = label.trim();
    
    setCatalog(prev => {
      const next = new Map(prev);
      if (trimmedLabel) {
        next.set(normalized, trimmedLabel);
      } else {
        // If label is empty, use fallback
        next.set(normalized, getFallbackLabel(normalized));
      }
      return next;
    });
  };

  /**
   * Remove a token from the catalog
   */
  const removeTokenLabel = (address: string): void => {
    try {
      const normalized = normalizeAddress(address);
      setCatalog(prev => {
        const next = new Map(prev);
        next.delete(normalized);
        return next;
      });
    } catch (error) {
      // Ignore invalid addresses
    }
  };

  /**
   * Get label for a token address (returns fallback if not found)
   */
  const getTokenLabel = (address: string): string => {
    try {
      const normalized = normalizeAddress(address);
      return catalog.get(normalized) || getFallbackLabel(normalized);
    } catch (error) {
      return 'Invalid Address';
    }
  };

  /**
   * Get fallback label (shortened address) when no custom label exists
   */
  const getFallbackLabel = (normalizedAddress: string): string => {
    return `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
  };

  /**
   * Get dropdown options from catalog entries
   */
  const getDropdownOptions = (addresses: string[]): TokenDropdownOption[] => {
    return addresses.map(address => {
      try {
        const normalized = normalizeAddress(address);
        const label = catalog.get(normalized) || getFallbackLabel(normalized);
        return {
          value: normalized,
          label,
          displayAddress: getFallbackLabel(normalized),
        };
      } catch (error) {
        return {
          value: address,
          label: 'Invalid Address',
          displayAddress: address,
        };
      }
    });
  };

  /**
   * Check if a token has a custom label (not using fallback)
   */
  const hasCustomLabel = (address: string): boolean => {
    try {
      const normalized = normalizeAddress(address);
      return catalog.has(normalized);
    } catch (error) {
      return false;
    }
  };

  return {
    catalog,
    setTokenLabel,
    removeTokenLabel,
    getTokenLabel,
    getDropdownOptions,
    hasCustomLabel,
    isLoading,
  };
}
