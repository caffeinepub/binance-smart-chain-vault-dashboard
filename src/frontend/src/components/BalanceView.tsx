import { useState } from 'react';
import { RefreshCw, AlertCircle, Pause, Play, Database, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { VaultBalancesTable } from '@/components/VaultBalancesTable';
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
          <CardTitle>Vault Balances</CardTitle>
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
    <div className="space-y-4">
      {/* Controls Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vault Controls</CardTitle>
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
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Resume</span>
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
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        {(error || bnbError) && (
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {bnbError && !error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>BNB: {bnbError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
        {metadataCacheSize > 0 && onClearMetadataCache && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span>{metadataCacheSize} token{metadataCacheSize !== 1 ? 's' : ''} cached</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCache}
                  className="h-7 gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Token Balances Table */}
      <VaultBalancesTable
        bnbBalance={bnbBalance}
        bnbValuation={bnbValuation}
        tokenBalances={tokenBalances}
        tokenValuations={tokenValuations}
        isLoadingPrices={isLoadingPrices}
      />
    </div>
  );
}
