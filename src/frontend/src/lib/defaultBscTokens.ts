/**
 * Default popular BSC tokens catalog
 * Single source of truth for initial token seeding
 */

export interface DefaultToken {
  address: string; // normalized lowercase 0x format
  label: string;   // human-friendly name
}

/**
 * Popular BSC tokens with their contract addresses
 * Addresses are normalized to lowercase 0x format
 */
export const DEFAULT_BSC_TOKENS: DefaultToken[] = [
  {
    address: '0x55d398326f99059ff775485246999027b3197955',
    label: 'USDT',
  },
  {
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    label: 'USDC',
  },
  {
    address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
    label: 'WBTC',
  },
  {
    address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    label: 'DAI',
  },
  {
    address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    label: 'ETH',
  },
  {
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    label: 'WBNB',
  },
];
