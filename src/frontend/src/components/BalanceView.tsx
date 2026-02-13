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
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const { bnbValuation, tokenValuations, isLoading: isLoadingPrices } = useBalanceValuations(
    bnbBalanceRaw,
    tokenBalances.map(t => ({ address: t.address, balanceRaw: t.balanceRaw, decimals: t.decimals }))
  );

  const handleRefresh = async () => {
    setIsRefreshingLocal(true);
    try {
      await onRefresh();
      toast.success('Balances refreshed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh balances');
    } finally {
      setIsRefreshingLocal(false);
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

  // Show spinner during background refresh (not during button click)
  const showSpinner = isRefreshing && !isRefreshingLocal;

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
              {showSpinner && (
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
              disabled={isRefreshingLocal}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingLocal ? 'animate-spin' : ''}`} />
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
              <span className="font-semibold">BNB</span>
              {bnbFallbackUsed && (
                <Badge variant="outline" className="text-xs">
                  Fallback
                </Badge>
              )}
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
          {bnbError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{bnbError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Token Balances */}
        {tokenBalances.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              {tokenBalances.map((token) => {
                const valuation = tokenValuations.get(token.address);
                return (
                  <div key={token.address} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{token.symbol}</span>
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

        {tokenBalances.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No token balances to display
          </div>
        )}

        {/* Metadata Cache Info */}
        {metadataCacheSize > 0 && onClearMetadataCache && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                <span>{metadataCacheSize} token{metadataCacheSize !== 1 ? 's' : ''} cached</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCache}
                className="h-6 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
