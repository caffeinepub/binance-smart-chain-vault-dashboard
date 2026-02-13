import { RefreshCw, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useBalanceValuations } from '@/hooks/useBalanceValuations';
import { WalletBalancesTable } from './WalletBalancesTable';

interface WalletBalancesViewProps {
  onRefresh?: () => void;
  onToggleLiveUpdates?: (enabled: boolean) => void;
}

export function WalletBalancesView({ onRefresh, onToggleLiveUpdates }: WalletBalancesViewProps) {
  const {
    bnbBalance,
    bnbBalanceRaw,
    tokenBalances,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
  } = useWalletBalances();

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

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Loading Wallet Balances...</CardTitle>
          <CardDescription>Fetching your wallet data from BSC network</CardDescription>
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
            <span>Wallet Balance Controls</span>
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
          <CardDescription>
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Not yet updated'}
          </CardDescription>
        </CardHeader>
        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Balances Table */}
      <WalletBalancesTable
        bnbBalance={bnbBalance}
        bnbValuation={bnbValuation}
        tokenBalances={tokenBalances}
        tokenValuations={tokenValuations}
        isLoadingPrices={isLoadingPrices}
      />
    </div>
  );
}
