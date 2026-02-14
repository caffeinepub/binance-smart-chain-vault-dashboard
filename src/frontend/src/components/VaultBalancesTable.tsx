import { TrendingUp, Coins, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { getTokenDisplayLabel } from '@/lib/tokenDisplay';

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
  error?: string;
  usedFallback?: boolean;
}

interface TokenValuation {
  usdValue?: string;
  bnbValue?: string;
  error?: string;
}

interface VaultBalancesTableProps {
  bnbBalance: string;
  bnbValuation: TokenValuation;
  tokenBalances: TokenBalance[];
  tokenValuations: Map<string, TokenValuation>;
  isLoadingPrices: boolean;
  hasWatchedTokens: boolean;
  tokenErrorCount: number;
}

export function VaultBalancesTable({
  bnbBalance,
  bnbValuation,
  tokenBalances,
  tokenValuations,
  isLoadingPrices,
  hasWatchedTokens,
  tokenErrorCount,
}: VaultBalancesTableProps) {
  const { catalog } = useSavedTokenCatalog();

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

        {/* Token error summary */}
        {tokenErrorCount > 0 && (
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              {tokenErrorCount} token balance{tokenErrorCount > 1 ? 's' : ''} could not be loaded. Check individual token rows for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state when no watched tokens */}
        {!hasWatchedTokens && (
          <Alert className="border-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              No tokens are being tracked. Add custom tokens to see their vault balances here.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Rows */}
        {tokenBalances.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {tokenBalances.map((token) => {
                const valuation = tokenValuations.get(token.address);
                const catalogLabel = catalog.get(token.address.toLowerCase());
                const displayLabel = getTokenDisplayLabel(
                  token.address,
                  catalogLabel,
                  token.symbol
                );
                
                return (
                  <div key={token.address} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant={token.error ? "destructive" : "outline"}>{displayLabel}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </span>
                      {token.usedFallback && !token.error && (
                        <Badge variant="secondary" className="text-xs">
                          ERC20
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">{token.balance}</div>
                      {token.error && (
                        <div className="text-xs text-destructive flex items-center gap-1 justify-end">
                          <AlertCircle className="h-3 w-3" />
                          {token.error}
                        </div>
                      )}
                      {!token.error && !isLoadingPrices && valuation && (
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
      </CardContent>
    </Card>
  );
}
