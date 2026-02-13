import { useState } from 'react';
import { Shield, History } from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { BalanceView } from '@/components/BalanceView';
import DepositForm from '@/components/DepositForm';
import WithdrawForm from '@/components/WithdrawForm';
import ContractInfo from '@/components/ContractInfo';
import { DiagnosticsBar } from '@/components/DiagnosticsBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/hooks/useWeb3';
import { useVaultBalances } from '@/hooks/useVaultBalances';

const BSC_CHAIN_ID = 56;

export function Dashboard() {
  const { isConnected, chainId, isMobile, hasMetaMask, switchToBSC } = useWeb3();
  const [isSwitching, setIsSwitching] = useState(false);
  
  // V14: Enable polling immediately
  const vaultBalances = useVaultBalances(true);

  const isWrongNetwork = isConnected && chainId !== null && chainId !== BSC_CHAIN_ID;

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchToBSC();
    } catch (err) {
      console.error('Failed to switch network:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Digital Asset Vault
          </h1>
        </div>

        {/* V14: Show dashboard when connected, regardless of chain */}
        {!isConnected ? (
          <div className="max-w-2xl mx-auto">
            <WalletConnect />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance View */}
            <BalanceView
              bnbBalance={vaultBalances.bnbBalance}
              bnbBalanceRaw={vaultBalances.bnbBalanceRaw}
              bnbError={vaultBalances.bnbError}
              bnbFallbackUsed={vaultBalances.bnbFallbackUsed}
              tokenBalances={vaultBalances.tokenBalances}
              isLoading={vaultBalances.isLoading}
              isRefreshing={vaultBalances.isRefreshing}
              error={vaultBalances.error}
              onRefresh={vaultBalances.refetch}
              lastUpdated={vaultBalances.lastUpdated}
              liveUpdatesEnabled={vaultBalances.liveUpdatesEnabled}
              onToggleLiveUpdates={vaultBalances.setLiveUpdatesEnabled}
              onClearMetadataCache={vaultBalances.clearMetadataCache}
              metadataCacheSize={vaultBalances.metadataCacheSize}
            />

            {/* Operations Tabs */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Vault Operations</CardTitle>
                <CardDescription>
                  Deposit or withdraw assets from your vault
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="deposit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">Deposit</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                  </TabsList>
                  <TabsContent value="deposit" className="mt-6">
                    <DepositForm
                      vaultBalances={vaultBalances}
                      isConnected={isConnected}
                      isWrongNetwork={isWrongNetwork}
                      onSwitchNetwork={handleSwitchNetwork}
                      isSwitching={isSwitching}
                    />
                  </TabsContent>
                  <TabsContent value="withdraw" className="mt-6">
                    <WithdrawForm
                      vaultBalances={vaultBalances}
                      isConnected={isConnected}
                      isWrongNetwork={isWrongNetwork}
                      onSwitchNetwork={handleSwitchNetwork}
                      isSwitching={isSwitching}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <ContractInfo />
          </div>
        )}
      </div>

      {/* Diagnostics Bar */}
      <DiagnosticsBar
        chainId={chainId}
        isMobile={isMobile}
        hasMetaMask={hasMetaMask}
      />
    </div>
  );
}
