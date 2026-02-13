/**
 * Pricing utility for fetching BNB and token prices from CoinGecko API
 * Uses free tier with no API key required
 */

interface PriceData {
  usd?: number;
  bnb?: number;
}

interface PriceFetchResult {
  success: boolean;
  price?: PriceData;
  error?: string;
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Known token mappings (contract address -> CoinGecko ID)
const TOKEN_ID_MAP: Record<string, string> = {
  // BNB Chain common tokens
  '0x55d398326f99059ff775485246999027b3197955': 'tether', // USDT
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'usd-coin', // USDC
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': 'binance-usd', // BUSD
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': 'ethereum', // ETH
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': 'bitcoin', // BTCB
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': 'pancakeswap-token', // CAKE
};

/**
 * Fetch BNB price in USDT
 */
export async function fetchBNBPrice(): Promise<PriceFetchResult> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=binancecoin&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.binancecoin?.usd) {
      return {
        success: true,
        price: {
          usd: data.binancecoin.usd,
        },
      };
    }

    return {
      success: false,
      error: 'Price data not available',
    };
  } catch (error: any) {
    console.error('Error fetching BNB price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch price',
    };
  }
}

/**
 * Fetch token price by contract address
 * Returns price in both USD and BNB when available
 */
export async function fetchTokenPrice(
  tokenAddress: string,
  bnbPriceUSD?: number
): Promise<PriceFetchResult> {
  try {
    const normalizedAddress = tokenAddress.toLowerCase();
    const coinGeckoId = TOKEN_ID_MAP[normalizedAddress];

    if (!coinGeckoId) {
      return {
        success: false,
        error: 'Token not in known list',
      };
    }

    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data[coinGeckoId]?.usd) {
      const usdPrice = data[coinGeckoId].usd;
      const result: PriceData = { usd: usdPrice };

      // Calculate BNB price if BNB/USD price is provided
      if (bnbPriceUSD && bnbPriceUSD > 0) {
        result.bnb = usdPrice / bnbPriceUSD;
      }

      return {
        success: true,
        price: result,
      };
    }

    return {
      success: false,
      error: 'Price data not available',
    };
  } catch (error: any) {
    console.error(`Error fetching token price for ${tokenAddress}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch price',
    };
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else if (price >= 0.01) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    });
  }
}
