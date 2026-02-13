import { useState } from 'react';
import { RefreshCw, Plus, Coins, X, AlertCircle, TrendingUp, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useBalanceValuations } from '@/hooks/useBalanceValuations';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from 'sonner';

interface BalanceViewProps {
  vaultBalances: ReturnType<typeof import('@/hooks/useVaultBalances').useVaultBalances>;
}

export default function BalanceView({ vaultBalances }: BalanceViewProps) {
  const { isConnected, chainId } = useWeb3();
  const { bnbBalance, bnbBalanceRaw, bnbError, tokenBalances, isLoading, refetch, error: fetchError } = vaultBalances;
  const { tokens: watchedTokens, addToken, removeToken } = useWatchedTokens();
  const { setTokenLabel, removeTokenLabel, getTokenLabel } = useSavedTokenCatalog();
  const { bnbValuation, tokenValuations, isLoading: isLoadingPrices } = useBalanceValuations(
    bnbBalanceRaw,
    tokenBalances
  );
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const BSC_CHAIN_ID = 56;
  const isWrongNetwork = chainId !== null && chainId !== BSC_CHAIN_ID;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Balances updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to refresh balances');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToken = () => {
    if (!newTokenAddress.trim()) {
      toast.error('Please enter a token address');
      return;
    }
    
    setIsAddingToken(true);
    try {
      addToken(newTokenAddress);
      // Save the label (or fallback if empty)
      setTokenLabel(newTokenAddress, newTokenLabel);
      toast.success('Token added to watch list');
      setNewTokenAddress('');
      setNewTokenLabel('');
    } catch (error: any) {
      // Display the descriptive error message from normalizeAddress
      toast.error(error.message || 'Invalid token address');
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleRemoveToken = (address: string) => {
    removeToken(address);
    removeTokenLabel(address);
    toast.success('Token removed from watch list');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddToken();
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-only mode info */}
      {!isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Read-Only Mode</AlertTitle>
          <AlertDescription>
            Viewing balances in read-only mode. Connect your wallet to deposit or withdraw tokens.
          </AlertDescription>
        </Alert>
      )}

      {/* Wrong network info */}
      {isConnected && isWrongNetwork && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Viewing Balances on Wrong Network</AlertTitle>
          <AlertDescription>
            You're viewing balances in read-only mode. Switch to BSC network to perform deposits or withdrawals.
          </AlertDescription>
        </Alert>
      )}

      {/* Top-level fetch error */}
      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Balances</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* BNB Balance Card */}
      <Card className="border-2 border-chart-1/30 bg-gradient-to-br from-chart-1/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-chart-1" />
                BNB Balance
              </CardTitle>
              <CardDescription>Native BNB in vault</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="rounded-full min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : bnbError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bnbError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold">{bnbBalance} BNB</p>
              <p className="text-sm text-muted-foreground">Binance Coin</p>
              {bnbValuation.usdValue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>≈ ${bnbValuation.usdValue} USDT</span>
                </div>
              )}
              {bnbValuation.error && !isLoadingPrices && (
                <p className="text-xs text-muted-foreground">
                  Price unavailable: {bnbValuation.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>BEP20 tokens in vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : tokenBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tokens being watched</p>
              <p className="text-sm mt-2">Add token addresses below to track their balances</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokenBalances.map((token) => {
                const label = getTokenLabel(token.address);
                const valuation = tokenValuations[token.address];
                
                return (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{label}</p>
                        <Badge variant="outline" className="text-xs">
                          {token.symbol}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground truncate">
                        {token.address}
                      </p>
                      {token.error ? (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">{token.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <p className="text-lg font-bold">{token.balance}</p>
                          {valuation?.usdValue && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span>≈ ${valuation.usdValue} USDT</span>
                            </div>
                          )}
                          {valuation?.bnbValue && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {valuation.bnbValue} BNB
                            </p>
                          )}
                          {valuation?.error && !isLoadingPrices && (
                            <p className="text-xs text-muted-foreground">
                              Price unavailable
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveToken(token.address)}
                      className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Token Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Token to Watch List
          </CardTitle>
          <CardDescription>
            Track BEP20 token balances in the vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenLabel">Token Label (Optional)</Label>
            <Input
              id="tokenLabel"
              placeholder="e.g., USDT, BUSD, My Token"
              value={newTokenLabel}
              onChange={(e) => setNewTokenLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAddingToken}
            />
            <p className="text-xs text-muted-foreground">
              Give this token a friendly name for easy identification
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenAddress">Token Contract Address</Label>
            <Input
              id="tokenAddress"
              placeholder="0x..."
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              className="font-mono text-sm"
              disabled={isAddingToken}
            />
            <p className="text-xs text-muted-foreground">
              Enter the BEP20 token contract address on BSC
            </p>
          </div>

          <Button
            onClick={handleAddToken}
            disabled={isAddingToken || !newTokenAddress}
            className="w-full min-h-[44px]"
          >
            {isAddingToken ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
