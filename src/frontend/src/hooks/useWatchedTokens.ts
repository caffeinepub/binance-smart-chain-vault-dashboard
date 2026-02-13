import { useState, useEffect } from 'react';
import { normalizeAddress } from '@/lib/evm';

const STORAGE_KEY = 'bsc-vault-watched-tokens';

/**
 * Hook to manage a persistent list of watched token addresses
 */
export function useWatchedTokens() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTokens(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading watched tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever tokens change
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
    try {
      const normalized = normalizeAddress(address);
      
      // Check if already exists
      if (tokens.some(t => t.toLowerCase() === normalized.toLowerCase())) {
        return false;
      }
      
      setTokens(prev => [...prev, normalized]);
      return true;
    } catch (error) {
      console.error('Error adding token:', error);
      throw error;
    }
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
