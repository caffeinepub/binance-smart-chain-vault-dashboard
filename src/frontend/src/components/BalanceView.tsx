import { useState } from 'react';
import { RefreshCw, Plus, Coins, X, AlertCircle, TrendingUp, Pause, Play, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useBalanceValuations } from '@/hooks/useBalanceValuations';
import { toast } from 'sonner';

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
  error?: string;
}

interface BalanceViewProps {
  bnbBalance: string;
  bnbBalanceRaw: bigint;
  bnbError: string | null;
  bnbFallbackUsed: boolean;
  tokenBalances: TokenBalance[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  lastUpdated: Date | null;
  liveUpdatesEnabled: boolean;
  onToggleLiveUpdates: (enabled: boolean) => void;
  onClearMetadataCache?: () => void;
  metadataCacheSize?: number;
}

export function BalanceView({
  bnbBalance,
  bnbBalanceRaw,
  bnbError,
  bnbFallbackUsed,
  tokenBalances,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
  lastUpdated,
  liveUpdatesEnabled,
  onToggleLiveUpdates,
  onClearMetadataCache,
  metadataCacheSize = 0,
}: BalanceViewProps) {
  const [isRefreshing_local, setIsRefreshing_local] = useState(false);
  const { bnbValuation, tokenValuations, isLoading: isLoadingPrices } = useBalanceValuations(
    bnbBalanceRaw,
    tokenBalances.map(t => ({ address: t.address, balanceRaw: t.balanceRaw, decimals: t.decimals }))
  );

  const handleRefresh = async () => {
    setIsRefreshing_local(true);
    try {
      await onRefresh();
      toast.success('Balances refreshed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh balances');
    } finally {
      setIsRefreshing_local(false);
    }
  };

  const handleToggleLiveUpdates = () => {
    const newState = !liveUpdatesEnabled;
    onToggleLiveUpdates(newState);
    toast.success(newState ? 'Live updates enabled' : 'Live updates paused');
  };

  const handleClearCache = () => {
    if (onClearMetadataCache) {
      onClearMetadataCache();
      toast.success('Token metadata cache cleared');
      handleRefresh();
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Vault Balances
          </CardTitle>
          <CardDescription>Loading vault balances...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Vault Balances
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Last updated: {formatLastUpdated(lastUpdated)}
              {isRefreshing && (
                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleLiveUpdates}
              className="gap-2"
            >
              {liveUpdatesEnabled ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing_local || isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isRefreshing_local || isRefreshing) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* BNB Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">BNB</span>
              {bnbFallbackUsed && (
                <Badge variant="outline" className="text-xs">
                  Read-only mode
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">
                {parseFloat(bnbBalance).toFixed(6)} BNB
              </div>
              {bnbValuation.usdValue && !isLoadingPrices && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                  <TrendingUp className="h-3 w-3" />
                  ${bnbValuation.usdValue} USD
                </div>
              )}
            </div>
          </div>
          {bnbError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{bnbError}</AlertDescription>
            </Alert>
          )}
        </div>

        {tokenBalances.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">BEP20 Tokens</h3>
                {metadataCacheSize > 0 && onClearMetadataCache && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCache}
                    className="h-7 text-xs gap-1"
                  >
                    <Database className="h-3 w-3" />
                    Clear cache ({metadataCacheSize})
                  </Button>
                )}
              </div>
              {tokenBalances.map((token) => {
                const valuation = tokenValuations.get(token.address.toLowerCase());
                
                return (
                  <div key={token.address} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">
                          {parseFloat(token.balance).toFixed(6)}
                        </div>
                        {valuation && !isLoadingPrices && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                            <TrendingUp className="h-3 w-3" />
                            {valuation.usdValue && `$${valuation.usdValue} USD`}
                            {valuation.bnbValue && (
                              <span className="text-xs">
                                ({valuation.bnbValue} BNB)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {token.error && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{token.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tokenBalances.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tokens being watched</p>
            <p className="text-xs mt-1">Add tokens to track their balances</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
