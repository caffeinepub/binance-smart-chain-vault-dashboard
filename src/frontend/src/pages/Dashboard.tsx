import { useState } from 'react';
import { Shield, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WalletConnect from '@/components/WalletConnect';
import { BalanceView } from '@/components/BalanceView';
import { DepositForm } from '@/components/DepositForm';
import { WithdrawForm } from '@/components/WithdrawForm';
import ContractInfo from '@/components/ContractInfo';
import { DiagnosticsBar } from '@/components/DiagnosticsBar';
import { useWeb3 } from '@/hooks/useWeb3';
import { useVaultBalances } from '@/hooks/useVaultBalances';
import { APP_BRANDING } from '@/lib/appBranding';

const BSC_CHAIN_ID = 56;

export function Dashboard() {
  const { isConnected, account, chainId, hasMetaMask, isMobile, isInitializing } = useWeb3();
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
  } = useVaultBalances();

  const [activeTab, setActiveTab] = useState<string>('deposit');

  // Check if on correct network
  const isOnBSC = chainId === BSC_CHAIN_ID;
  
  // Show WalletConnect panel when:
  // - Still initializing
  // - Not connected
  // - Connected but on wrong network (and chainId is known)
  const shouldShowWalletConnectPanel = isInitializing || !isConnected || (isConnected && chainId !== null && !isOnBSC);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {APP_BRANDING.fullName}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {APP_BRANDING.tagline}
          </p>
        </div>

        {/* Wallet Connection Panel - Show when not ready */}
        {shouldShowWalletConnectPanel && (
          <div className="max-w-md mx-auto">
            <WalletConnect />
            {isConnected && chainId !== null && !isOnBSC && (
              <Alert className="mt-4">
                <AlertDescription>
                  Please switch to Binance Smart Chain (BSC) network to view your vault balances and perform operations.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Content - Show when connected AND on BSC (or detecting network) */}
        {!isInitializing && isConnected && (isOnBSC || chainId === null) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Balances */}
            <div className="space-y-6">
              <BalanceView
                bnbBalance={bnbBalance}
                bnbBalanceRaw={bnbBalanceRaw}
                bnbError={bnbError}
                bnbFallbackUsed={bnbFallbackUsed}
                tokenBalances={tokenBalances}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                error={error}
                onRefresh={refetch}
                lastUpdated={lastUpdated}
                liveUpdatesEnabled={liveUpdatesEnabled}
                onToggleLiveUpdates={setLiveUpdatesEnabled}
                onClearMetadataCache={clearMetadataCache}
                metadataCacheSize={metadataCacheSize}
              />
            </div>

            {/* Right Column: Operations */}
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Vault Operations
                  </CardTitle>
                  <CardDescription>
                    Deposit or withdraw assets from your vault
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="deposit" className="gap-2">
                        <ArrowDownToLine className="h-4 w-4" />
                        Deposit
                      </TabsTrigger>
                      <TabsTrigger value="withdraw" className="gap-2">
                        <ArrowUpFromLine className="h-4 w-4" />
                        Withdraw
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="deposit" className="mt-4">
                      <DepositForm onSuccess={refetch} />
                    </TabsContent>
                    <TabsContent value="withdraw" className="mt-4">
                      <WithdrawForm onSuccess={refetch} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <ContractInfo />
            </div>
          </div>
        )}

        {/* Diagnostics Bar */}
        <DiagnosticsBar chainId={chainId} isMobile={isMobile} hasMetaMask={hasMetaMask} />
      </div>
    </div>
  );
}
