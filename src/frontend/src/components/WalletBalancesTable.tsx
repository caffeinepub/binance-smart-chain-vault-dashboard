import { TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
}

interface TokenValuation {
  usdValue?: string;
  bnbValue?: string;
  error?: string;
}

interface WalletBalancesTableProps {
  bnbBalance: string;
  bnbValuation: TokenValuation;
  tokenBalances: TokenBalance[];
  tokenValuations: Map<string, TokenValuation>;
  isLoadingPrices: boolean;
}

export function WalletBalancesTable({
  bnbBalance,
  bnbValuation,
  tokenBalances,
  tokenValuations,
  isLoadingPrices,
}: WalletBalancesTableProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Wallet Balances
        </CardTitle>
        <CardDescription>Your connected wallet holdings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* BNB Row */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">BNB</Badge>
            <span className="text-xs text-muted-foreground">Native Token</span>
          </div>
          <div className="text-right">
            <div className="font-mono font-semibold">{bnbBalance}</div>
            {!isLoadingPrices && bnbValuation.usdValue && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="h-3 w-3" />
                ≈ {bnbValuation.usdValue} USDT
              </div>
            )}
            {!isLoadingPrices && bnbValuation.error && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <AlertCircle className="h-3 w-3" />
                Price unavailable
              </div>
            )}
          </div>
        </div>

        {/* Token Rows */}
        {tokenBalances.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {tokenBalances.map((token) => {
                const valuation = tokenValuations.get(token.address);
                return (
                  <div key={token.address} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{token.symbol}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">{token.balance}</div>
                      {!isLoadingPrices && valuation && (
                        <>
                          {valuation.usdValue && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <TrendingUp className="h-3 w-3" />
                              ≈ {valuation.usdValue} USDT
                              {valuation.bnbValue && ` (${valuation.bnbValue} BNB)`}
                            </div>
                          )}
                          {valuation.error && !valuation.usdValue && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <AlertCircle className="h-3 w-3" />
                              Price unavailable
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* No watched tokens message */}
        {tokenBalances.length === 0 && (
          <>
            <Separator />
            <div className="text-center py-4 text-muted-foreground text-sm">
              No watched tokens. Only watched tokens are displayed here.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
