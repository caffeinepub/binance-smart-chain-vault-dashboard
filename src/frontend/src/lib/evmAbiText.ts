/**
 * Browser-safe EVM ABI text decoding utilities
 * Decodes common ERC-20 metadata return values (symbol, name) without Node.js Buffer
 */

/**
 * Decode a dynamic string from ABI-encoded hex result
 * Handles both dynamic string (with offset+length) and bytes32 formats
 */
export function decodeAbiString(hexResult: string): string {
  if (!hexResult || hexResult === '0x' || hexResult.length < 3) {
    return '';
  }

  try {
    const hex = hexResult.slice(2); // Remove '0x' prefix

    // Try dynamic string format first (offset + length + data)
    if (hex.length >= 128) {
      // Skip first 64 chars (offset), next 64 chars contain length
      const lengthHex = hex.slice(64, 128);
      const length = parseInt(lengthHex, 16);
      
      if (length > 0 && length < 1000) { // Sanity check
        const dataHex = hex.slice(128, 128 + length * 2);
        return hexToUtf8(dataHex);
      }
    }

    // Try bytes32 format (fixed 32 bytes, null-padded)
    if (hex.length === 64) {
      return hexToUtf8(hex);
    }

    // Fallback: decode whatever we have
    return hexToUtf8(hex);
  } catch (err) {
    console.warn('Failed to decode ABI string:', err);
    return '';
  }
}

/**
 * Convert hex string to UTF-8, stripping null bytes
 * Uses browser-native TextDecoder
 */
function hexToUtf8(hex: string): string {
  try {
    // Convert hex to Uint8Array
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    
    // Decode using TextDecoder
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(bytes);
    
    // Strip null bytes and control characters
    text = text.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    
    return text.trim();
  } catch (err) {
    console.warn('Failed to decode hex to UTF-8:', err);
    return '';
  }
}

/**
 * Decode ERC-20 symbol() result with graceful fallback
 */
export function decodeTokenSymbol(hexResult: string, fallback: string = 'TOKEN'): string {
  const decoded = decodeAbiString(hexResult);
  
  // Validate result: should be 1-10 alphanumeric chars
  if (decoded && /^[A-Za-z0-9]{1,10}$/.test(decoded)) {
    return decoded.toUpperCase();
  }
  
  return fallback;
}

/**
 * Decode ERC-20 name() result with graceful fallback
 */
export function decodeTokenName(hexResult: string, fallback: string = 'Unknown Token'): string {
  const decoded = decodeAbiString(hexResult);
  
  // Validate result: should be reasonable length
  if (decoded && decoded.length > 0 && decoded.length < 100) {
    return decoded;
  }
  
  return fallback;
}
