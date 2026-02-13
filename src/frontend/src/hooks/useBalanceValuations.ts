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
          
          // Calculate BNB valuation
          const bnbBalanceNum = Number(bnbBalanceRaw) / 1e18;
          const bnbUsdValue = bnbBalanceNum * bnbPriceUSD;
          
          setBnbValuation({
            usdValue: formatPrice(bnbUsdValue, 2),
          });

          // Fetch token prices
          const newTokenValuations = new Map<string, Valuation>();
          
          for (const token of tokenBalances) {
            if (!isMounted) break;

            const tokenPriceResult = await fetchTokenPrice(token.address, bnbPriceUSD);
            
            if (tokenPriceResult.success && tokenPriceResult.price) {
              const tokenBalanceNum = Number(token.balanceRaw) / Math.pow(10, token.decimals);
              
              const valuation: Valuation = {};
              
              if (tokenPriceResult.price.usd) {
                const usdValue = tokenBalanceNum * tokenPriceResult.price.usd;
                valuation.usdValue = formatPrice(usdValue, 2);
              }
              
              if (tokenPriceResult.price.bnb) {
                const bnbValue = tokenBalanceNum * tokenPriceResult.price.bnb;
                valuation.bnbValue = formatPrice(bnbValue, 4);
              }
              
              newTokenValuations.set(token.address, valuation);
            } else {
              newTokenValuations.set(token.address, {
                error: tokenPriceResult.error || 'Price unavailable',
              });
            }
          }
          
          if (isMounted) {
            setTokenValuations(newTokenValuations);
          }
        } else {
          if (isMounted) {
            setBnbValuation({
              error: bnbPriceResult.error || 'Price unavailable',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching valuations:', error);
        if (isMounted) {
          setBnbValuation({ error: 'Failed to fetch prices' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchValuations();

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
