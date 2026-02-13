import { useState, useEffect } from 'react';
import { fetchBNBPrice, fetchTokenPrice, formatPrice } from '@/lib/prices';

interface TokenBalance {
  address: string;
  balanceRaw: bigint;
  decimals: number;
}

interface Valuation {
  usdValue?: string;
  bnbValue?: string;
  error?: string;
}

interface BalanceValuations {
  bnbValuation: Valuation;
  tokenValuations: Map<string, Valuation>;
  isLoading: boolean;
}

export function useBalanceValuations(
  bnbBalanceRaw: bigint,
  tokenBalances: TokenBalance[]
): BalanceValuations {
  const [bnbValuation, setBnbValuation] = useState<Valuation>({});
  const [tokenValuations, setTokenValuations] = useState<Map<string, Valuation>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchValuations = async () => {
      setIsLoading(true);

      try {
        // Fetch BNB price first
        const bnbPriceResult = await fetchBNBPrice();
        
        if (!isMounted) return;

        if (bnbPriceResult.success && bnbPriceResult.price?.usd) {
          const bnbPriceUSD = bnbPriceResult.price.usd;
          const bnbBalanceNum = Number(bnbBalanceRaw) / 1e18;
          const bnbUsdValue = bnbBalanceNum * bnbPriceUSD;

          setBnbValuation({
            usdValue: formatPrice(bnbUsdValue),
          });

          // Fetch token prices
          const newTokenValuations = new Map<string, Valuation>();

          await Promise.all(
            tokenBalances.map(async (token) => {
              try {
                const tokenPriceResult = await fetchTokenPrice(token.address, bnbPriceUSD);
                
                if (!isMounted) return;

                if (tokenPriceResult.success && tokenPriceResult.price) {
                  const tokenBalanceNum = Number(token.balanceRaw) / Math.pow(10, token.decimals);
                  
                  const valuation: Valuation = {};

                  if (tokenPriceResult.price.usd) {
                    const tokenUsdValue = tokenBalanceNum * tokenPriceResult.price.usd;
                    valuation.usdValue = formatPrice(tokenUsdValue);
                  }

                  if (tokenPriceResult.price.bnb) {
                    const tokenBnbValue = tokenBalanceNum * tokenPriceResult.price.bnb;
                    valuation.bnbValue = formatPrice(tokenBnbValue, 4);
                  }

                  newTokenValuations.set(token.address, valuation);
                } else {
                  newTokenValuations.set(token.address, {
                    error: tokenPriceResult.error || 'Price unavailable',
                  });
                }
              } catch (err) {
                console.error(`Error fetching price for ${token.address}:`, err);
                newTokenValuations.set(token.address, {
                  error: 'Price unavailable',
                });
              }
            })
          );

          if (isMounted) {
            setTokenValuations(newTokenValuations);
          }
        } else {
          // BNB price fetch failed
          setBnbValuation({
            error: bnbPriceResult.error || 'Price unavailable',
          });
        }
      } catch (err) {
        console.error('Error fetching valuations:', err);
        if (isMounted) {
          setBnbValuation({
            error: 'Price unavailable',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch if we have balances
    if (bnbBalanceRaw > 0n || tokenBalances.length > 0) {
      fetchValuations();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [bnbBalanceRaw, tokenBalances]);

  return {
    bnbValuation,
    tokenValuations,
    isLoading,
  };
}
