import { useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Info, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WalletConnect from '@/components/WalletConnect';
import BalanceView from '@/components/BalanceView';
import DepositForm from '@/components/DepositForm';
import WithdrawForm from '@/components/WithdrawForm';
import ContractInfo from '@/components/ContractInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeb3 } from '@/hooks/useWeb3';
import { useVaultBalances } from '@/hooks/useVaultBalances';

export default function Dashboard() {
  const { account, isConnected, isInitializing, hasMetaMask, isMobile, chainId, error: web3Error, switchToBSC } = useWeb3();
  const [activeTab, setActiveTab] = useState('balances');
  const [isSwitching, setIsSwitching] = useState(false);

  // Lift vault balances to Dashboard level so they're available across all tabs
  const vaultBalances = useVaultBalances();

  const BSC_CHAIN_ID = 56;
  const isWrongNetwork = hasMetaMask && chainId !== null && chainId !== BSC_CHAIN_ID;

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

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <Skeleton className="h-10 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-10 w-full max-w-xs mx-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
              BSC Vault Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your BEP20 tokens and BNB on Binance Smart Chain
            </p>
          </div>

          {/* Wallet Not Available Alert (Mobile) */}
          {!hasMetaMask && isMobile && (
            <Alert className="border-chart-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Open in Wallet Browser</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>To use this dApp on mobile, open it inside your wallet app's built-in browser.</p>
                <p className="text-sm">
                  Supported wallets: MetaMask, Trust Wallet, SafePal, TokenPocket, and other EVM-compatible wallets.
                </p>
                <p className="text-sm font-medium">
                  Open your wallet app → Tap browser icon → Enter this URL
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Not Available Alert (Desktop) */}
          {!hasMetaMask && !isMobile && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>EVM Wallet Not Detected</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>An EVM-compatible wallet extension is required to use this application.</p>
                <p className="text-sm">
                  Install MetaMask, Trust Wallet, or another EVM wallet extension from{' '}
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-destructive-foreground"
                  >
                    metamask.io
                  </a>
                  {' '}and refresh this page.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Wrong Network Alert */}
          {hasMetaMask && isWrongNetwork && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wrong Network</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>You're connected to chain ID {chainId}. This dApp requires Binance Smart Chain (chain ID 56).</p>
                <Button
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                  size="sm"
                  variant="outline"
                  className="bg-background hover:bg-background/80"
                >
                  {isSwitching ? 'Switching...' : 'Switch to BSC Network'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Network Error Alert */}
          {hasMetaMask && web3Error && !isConnected && !isWrongNetwork && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{web3Error}</AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Card (when not connected) */}
          {!isConnected && (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="pt-6">
                <WalletConnect />
              </CardContent>
            </Card>
          )}

          {/* Connected Wallet Info */}
          {isConnected && (
            <Card className="bg-gradient-to-r from-primary/10 via-chart-1/10 to-chart-2/10 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Connected Wallet</p>
                      <p className="font-mono text-sm md:text-base font-medium break-all">
                        {account}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs - Always visible */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger 
                value="balances" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 md:px-4 min-h-[3rem] md:min-h-0"
              >
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Balances</span>
              </TabsTrigger>
              <TabsTrigger 
                value="deposit" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 md:px-4 min-h-[3rem] md:min-h-0"
              >
                <ArrowDownToLine className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Deposit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="withdraw" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 md:px-4 min-h-[3rem] md:min-h-0"
              >
                <ArrowUpFromLine className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Withdraw</span>
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 md:px-4 min-h-[3rem] md:min-h-0"
              >
                <Info className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Info</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="mt-6">
              <BalanceView vaultBalances={vaultBalances} />
            </TabsContent>

            <TabsContent value="deposit" className="mt-6">
              {!isConnected ? (
                <Card>
                  <CardContent className="pt-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wallet Connection Required</AlertTitle>
                      <AlertDescription>
                        Please connect your wallet to deposit tokens into the vault.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : isWrongNetwork ? (
                <Card>
                  <CardContent className="pt-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wrong Network</AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>Please switch to Binance Smart Chain (BSC) to perform deposits.</p>
                        <Button
                          onClick={handleSwitchNetwork}
                          disabled={isSwitching}
                          size="sm"
                          variant="outline"
                          className="bg-background hover:bg-background/80"
                        >
                          {isSwitching ? 'Switching...' : 'Switch to BSC Network'}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <DepositForm vaultBalances={vaultBalances} />
              )}
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
              {!isConnected ? (
                <Card>
                  <CardContent className="pt-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wallet Connection Required</AlertTitle>
                      <AlertDescription>
                        Please connect your wallet to withdraw tokens from the vault.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : isWrongNetwork ? (
                <Card>
                  <CardContent className="pt-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wrong Network</AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>Please switch to Binance Smart Chain (BSC) to perform withdrawals.</p>
                        <Button
                          onClick={handleSwitchNetwork}
                          disabled={isSwitching}
                          size="sm"
                          variant="outline"
                          className="bg-background hover:bg-background/80"
                        >
                          {isSwitching ? 'Switching...' : 'Switch to BSC Network'}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <WithdrawForm vaultBalances={vaultBalances} />
              )}
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <ContractInfo />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
