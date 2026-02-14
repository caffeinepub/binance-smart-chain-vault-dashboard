import { normalizeAddress } from './evm';

/**
 * Shared utilities for consistent token label display across the UI
 * Ensures no "not available" labels appear; always provides a meaningful fallback
 */

/**
 * Get a display label for a token with the following precedence:
 * 1. Saved catalog label (if exists)
 * 2. Cached/fetched symbol (if valid)
 * 3. Shortened address fallback
 * 
 * Never returns "not available" or empty string
 */
export function getTokenDisplayLabel(
  address: string,
  catalogLabel: string | undefined,
  cachedSymbol: string | undefined
): string {
  try {
    const normalized = normalizeAddress(address);
    
    // Priority 1: Catalog label
    if (catalogLabel && catalogLabel.trim()) {
      return catalogLabel.trim();
    }
    
    // Priority 2: Valid cached symbol
    if (cachedSymbol && isValidSymbol(cachedSymbol)) {
      return cachedSymbol.toUpperCase();
    }
    
    // Priority 3: Shortened address fallback
    return getShortenedAddress(normalized);
  } catch (error) {
    // If address is invalid, return a safe fallback
    return 'Invalid Address';
  }
}

/**
 * Check if a symbol is valid (non-empty, reasonable length, alphanumeric)
 */
export function isValidSymbol(symbol: string): boolean {
  if (!symbol || !symbol.trim()) {
    return false;
  }
  
  const trimmed = symbol.trim();
  
  // Should be 1-10 alphanumeric characters
  return /^[A-Za-z0-9]{1,10}$/.test(trimmed);
}

/**
 * Get shortened address for display (0x1234...abcd)
 */
export function getShortenedAddress(address: string): string {
  try {
    const normalized = normalizeAddress(address);
    return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
  } catch (error) {
    return address.slice(0, 10) + '...';
  }
}

/**
 * Suggest a label from fetched metadata (symbol or name)
 * Returns empty string if no valid suggestion available
 */
export function suggestLabelFromMetadata(
  symbol: string | undefined,
  name: string | undefined
): string {
  // Prefer symbol if valid
  if (symbol && isValidSymbol(symbol)) {
    return symbol.toUpperCase();
  }
  
  // Fall back to name if reasonable
  if (name && name.trim() && name.length > 0 && name.length < 50) {
    return name.trim();
  }
  
  return '';
}

/**
 * Get a safe label for saving (never empty)
 * If no label provided, uses shortened address
 */
export function getSafeLabelForSaving(
  address: string,
  proposedLabel: string | undefined
): string {
  if (proposedLabel && proposedLabel.trim()) {
    return proposedLabel.trim();
  }
  
  try {
    const normalized = normalizeAddress(address);
    return getShortenedAddress(normalized);
  } catch (error) {
    return 'Custom Token';
  }
}
