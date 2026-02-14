import { useState, useEffect } from 'react';
import { normalizeAddress } from '@/lib/evm';
import { DEFAULT_BSC_TOKENS } from '@/lib/defaultBscTokens';

const STORAGE_KEY = 'bsc-vault-watched-tokens';
const SEEDED_FLAG_KEY = 'bsc-vault-tokens-seeded';

/**
 * Hook to manage a persistent list of watched token addresses with strict validation and normalization
 */
export function useWatchedTokens() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount and validate/normalize all stored addresses
  useEffect(() => {
    try {
      const seeded = localStorage.getItem(SEEDED_FLAG_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!seeded) {
        // First time: seed with default BSC tokens
        const defaultAddresses = DEFAULT_BSC_TOKENS.map(t => t.address);
        setTokens(defaultAddresses);
        localStorage.setItem(SEEDED_FLAG_KEY, 'true');
      } else if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate and normalize each stored address, discard invalid ones
          const validTokens: string[] = [];
          for (const addr of parsed) {
            try {
              const normalized = normalizeAddress(addr);
              validTokens.push(normalized);
            } catch (error) {
              console.warn('Discarding invalid stored token address:', addr);
            }
          }
          setTokens(validTokens);
        }
      }
    } catch (error) {
      console.error('Error loading watched tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever tokens change (always normalized)
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      } catch (error) {
        console.error('Error saving watched tokens:', error);
      }
    }
  }, [tokens, isLoading]);

  const addToken = (address: string): boolean => {
    // Normalize and validate - will throw descriptive error if invalid
    const normalized = normalizeAddress(address);
    
    // Check if already exists (case-insensitive)
    if (tokens.some(t => t.toLowerCase() === normalized.toLowerCase())) {
      throw new Error('Token is already in your watch list');
    }
    
    setTokens(prev => [...prev, normalized]);
    return true;
  };

  const removeToken = (address: string): void => {
    const normalized = address.toLowerCase();
    setTokens(prev => prev.filter(t => t.toLowerCase() !== normalized));
  };

  const hasToken = (address: string): boolean => {
    const normalized = address.toLowerCase();
    return tokens.some(t => t.toLowerCase() === normalized);
  };

  return {
    tokens,
    addToken,
    removeToken,
    hasToken,
    isLoading,
  };
}
