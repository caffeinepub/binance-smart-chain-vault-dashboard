import { TrendingUp, Coins } from 'lucide-react';
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
}

interface VaultBalancesTableProps {
  bnbBalance: string;
  bnbValuation: TokenValuation;
  tokenBalances: TokenBalance[];
  tokenValuations: Map<string, TokenValuation>;
  isLoadingPrices: boolean;
}

export function VaultBalancesTable({
  bnbBalance,
  bnbValuation,
  tokenBalances,
  tokenValuations,
  isLoadingPrices,
}: VaultBalancesTableProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Token Balances
        </CardTitle>
        <CardDescription>Your vault holdings by token</CardDescription>
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
            {bnbValuation.usdValue && !isLoadingPrices && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="h-3 w-3" />
                ${bnbValuation.usdValue}
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
                      {valuation && !isLoadingPrices && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <TrendingUp className="h-3 w-3" />
                          {valuation.usdValue && `$${valuation.usdValue}`}
                          {valuation.bnbValue && ` (${valuation.bnbValue} BNB)`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* No additional tokens message */}
        {tokenBalances.length === 0 && (
          <>
            <Separator />
            <div className="text-center py-4 text-muted-foreground text-sm">
              No additional tokens in vault
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
