import { RefreshCw, Pause, Play, Trash2, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVaultBalances } from '@/hooks/useVaultBalances';
import { useBalanceValuations } from '@/hooks/useBalanceValuations';
import { VaultBalancesTable } from './VaultBalancesTable';
import { useWeb3 } from '@/hooks/useWeb3';

interface BalanceViewProps {
  onRefresh?: () => void;
  onToggleLiveUpdates?: (enabled: boolean) => void;
}

export function BalanceView({ onRefresh, onToggleLiveUpdates }: BalanceViewProps) {
  const { chainId } = useWeb3();
  const {
    bnbBalance,
    bnbBalanceRaw,
    bnbError,
    bnbFallbackUsed,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
    clearMetadataCache,
    metadataCacheSize,
    hasWatchedTokens,
    tokenErrorCount,
  } = useVaultBalances();

  const { bnbValuation, tokenValuations, isLoading: isLoadingPrices } = useBalanceValuations(
    bnbBalanceRaw,
    tokenBalances
  );

  const handleRefresh = async () => {
    await refetch();
    onRefresh?.();
  };

  const handleToggleLiveUpdates = () => {
    const newValue = !liveUpdatesEnabled;
    setLiveUpdatesEnabled(newValue);
    onToggleLiveUpdates?.(newValue);
  };

  const isOnBSC = chainId === 56;

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Loading Balances...</CardTitle>
          <CardDescription>Fetching vault data from BSC network</CardDescription>
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
          <CardTitle className="flex items-center justify-between">
            <span>Balance Controls</span>
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
                    Pause Updates
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Resume Updates
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : 'Not yet updated'}
            </span>
            {metadataCacheSize > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMetadataCache}
                className="gap-2 text-xs h-7"
              >
                <Trash2 className="h-3 w-3" />
                Clear Cache ({metadataCacheSize})
              </Button>
            )}
          </CardDescription>
        </CardHeader>
        {(error || bnbFallbackUsed || !isOnBSC) && (
          <CardContent className="pt-0 space-y-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isOnBSC && (
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  Wrong network detected. Please switch to BSC (BNB Smart Chain) to view vault balances.
                </AlertDescription>
              </Alert>
            )}
            {bnbFallbackUsed && !error && (
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  BNB balance fetched using native balance fallback (contract method unavailable)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Balances Table */}
      <VaultBalancesTable
        bnbBalance={bnbBalance}
        bnbValuation={bnbValuation}
        tokenBalances={tokenBalances}
        tokenValuations={tokenValuations}
        isLoadingPrices={isLoadingPrices}
        hasWatchedTokens={hasWatchedTokens}
        tokenErrorCount={tokenErrorCount}
      />
    </div>
  );
}
