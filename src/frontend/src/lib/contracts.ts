import { encodeUint256, encodeAddress, decodeUint256, decodeAddress } from './evm';

export const VAULT_ADDRESS = '0xd2e7DA1e8E2cda1512A5CC9d1C477D95599f0eC4';

// Function signatures (first 4 bytes of keccak256 hash)
const FUNCTION_SIGNATURES: Record<string, string> = {
  owner: '0x8da5cb5b',
  bnbBalance: '0x7bb98a68',
  tokenBalance: '0xe3ee160e',
  depositToken: '0x338b5dea',
  withdrawBNB: '0xf14210a6',
  withdrawToken: '0x01e33667',
  // ERC20 approve
  approve: '0x095ea7b3',
  // ERC20 balanceOf
  balanceOf: '0x70a08231',
};

export type ParamType = 'address' | 'uint256';

export interface MethodParam {
  type: ParamType;
  value: string | bigint;
}

/**
 * Encodes a contract method call with properly formatted parameters
 */
export function encodeCall(method: string, params: MethodParam[] = []): string {
  const signature = FUNCTION_SIGNATURES[method];
  if (!signature) {
    throw new Error(`Unknown method: ${method}`);
  }

  let encodedParams = '';
  
  for (const param of params) {
    if (param.type === 'address') {
      encodedParams += encodeAddress(param.value as string);
    } else if (param.type === 'uint256') {
      encodedParams += encodeUint256(param.value);
    } else {
      throw new Error(`Unsupported parameter type: ${param.type}`);
    }
  }

  return signature + encodedParams;
}

/**
 * Decodes a contract call result based on the expected return type
 */
export function decodeResult(result: string, type: ParamType): string | bigint {
  if (!result || result === '0x') {
    if (type === 'uint256') {
      return 0n;
    }
    return '0x0000000000000000000000000000000000000000';
  }

  if (type === 'uint256') {
    return decodeUint256(result);
  }

  if (type === 'address') {
    return decodeAddress(result);
  }

  throw new Error(`Unsupported return type: ${type}`);
}

// Re-export commonly used utilities
export { decodeUint256 } from './evm';
