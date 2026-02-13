/**
 * EVM utility helpers for safe BigInt-based encoding/decoding
 * and address validation without ethers.js
 */

/**
 * Validates and normalizes an Ethereum address
 */
export function normalizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }
  
  const cleaned = address.trim().toLowerCase();
  
  if (!cleaned.startsWith('0x')) {
    throw new Error('Invalid address: must start with 0x');
  }
  
  if (cleaned.length !== 42) {
    throw new Error('Invalid address: must be 42 characters (0x + 40 hex chars)');
  }
  
  if (!/^0x[0-9a-f]{40}$/.test(cleaned)) {
    throw new Error('Invalid address: contains non-hex characters');
  }
  
  return cleaned;
}

/**
 * Encodes a uint256 value as a 32-byte left-padded hex string (no 0x prefix)
 */
export function encodeUint256(value: bigint | string | number): string {
  let bigIntValue: bigint;
  
  if (typeof value === 'bigint') {
    bigIntValue = value;
  } else if (typeof value === 'string') {
    // Handle hex strings
    if (value.startsWith('0x')) {
      bigIntValue = BigInt(value);
    } else {
      bigIntValue = BigInt(value);
    }
  } else if (typeof value === 'number') {
    bigIntValue = BigInt(Math.floor(value));
  } else {
    throw new Error('Invalid uint256 value type');
  }
  
  if (bigIntValue < 0n) {
    throw new Error('uint256 cannot be negative');
  }
  
  // Convert to hex and pad to 64 characters (32 bytes)
  const hex = bigIntValue.toString(16);
  return hex.padStart(64, '0');
}

/**
 * Encodes an address as a 32-byte left-padded hex string (no 0x prefix)
 */
export function encodeAddress(address: string): string {
  const normalized = normalizeAddress(address);
  // Remove 0x and pad to 64 characters (32 bytes)
  return normalized.slice(2).padStart(64, '0');
}

/**
 * Decodes a uint256 result from a 32-byte hex string to BigInt
 */
export function decodeUint256(hex: string): bigint {
  if (!hex || hex === '0x') {
    return 0n;
  }
  
  const cleaned = hex.startsWith('0x') ? hex : '0x' + hex;
  return BigInt(cleaned);
}

/**
 * Decodes an address result from a 32-byte hex string
 */
export function decodeAddress(hex: string): string {
  if (!hex || hex === '0x') {
    return '0x0000000000000000000000000000000000000000';
  }
  
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  // Address is in the last 40 characters (20 bytes)
  const addressHex = cleaned.slice(-40);
  return '0x' + addressHex.toLowerCase();
}

/**
 * Converts a decimal string to wei (BigInt) with specified decimals
 * Safe alternative to parseFloat(amount) * 1e18
 */
export function parseUnits(value: string, decimals: number = 18): bigint {
  if (!value || value.trim() === '') {
    throw new Error('Invalid value: empty string');
  }
  
  const cleaned = value.trim();
  
  // Split on decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    throw new Error('Invalid value: multiple decimal points');
  }
  
  const [integerPart, fractionalPart = ''] = parts;
  
  // Validate integer part
  if (!/^\d+$/.test(integerPart)) {
    throw new Error('Invalid value: non-numeric characters in integer part');
  }
  
  // Validate fractional part
  if (fractionalPart && !/^\d+$/.test(fractionalPart)) {
    throw new Error('Invalid value: non-numeric characters in fractional part');
  }
  
  // Truncate or pad fractional part to match decimals
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  
  // Combine and convert to BigInt
  const combined = integerPart + paddedFractional;
  return BigInt(combined);
}

/**
 * Converts wei (BigInt) to a decimal string with specified decimals
 * Safe alternative to (parseInt(hex, 16) / 1e18).toFixed(4)
 */
export function formatUnits(value: bigint, decimals: number = 18, displayDecimals: number = 4): string {
  if (value < 0n) {
    throw new Error('Cannot format negative value');
  }
  
  const valueStr = value.toString();
  
  // If value is smaller than 10^decimals, pad with leading zeros
  const paddedValue = valueStr.padStart(decimals + 1, '0');
  
  // Split into integer and fractional parts
  const integerPart = paddedValue.slice(0, -decimals) || '0';
  const fractionalPart = paddedValue.slice(-decimals);
  
  // Truncate fractional part to displayDecimals
  const truncatedFractional = fractionalPart.slice(0, displayDecimals);
  
  // Remove trailing zeros from fractional part
  const trimmedFractional = truncatedFractional.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return integerPart;
  }
  
  return `${integerPart}.${trimmedFractional}`;
}
