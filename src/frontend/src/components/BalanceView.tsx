import { useState } from 'react';
import { RefreshCw, Plus, Coins, X, AlertCircle, TrendingUp, Info, Loader2, Play, Pause } from 'lucide-react';
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
  const { 
    bnbBalance, 
    bnbBalanceRaw, 
    bnbError, 
    bnbFallbackUsed,
    tokenBalances, 
    isLoading, 
    refetch, 
    error: fetchError,
    lastUpdated,
    liveUpdatesEnabled,
    setLiveUpdatesEnabled,
  } = vaultBalances;
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

  const toggleLiveUpdates = () => {
    setLiveUpdatesEnabled(!liveUpdatesEnabled);
    toast.success(liveUpdatesEnabled ? 'Live updates paused' : 'Live updates enabled');
  };

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Read-only mode info */}
      {!isConnected && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Read-Only Mode</AlertTitle>
          <AlertDescription>
            Viewing balances in read-only mode. Connect your wallet to deposit or withdraw tokens.
          </AlertDescription>
        </Alert>
      )}

      {/* Wrong network info */}
      {isConnected && isWrongNetwork && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription>
            Please switch to Binance Smart Chain (BSC) to interact with the vault.
          </AlertDescription>
        </Alert>
      )}

      {/* Top-level fetch error */}
      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Balances</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Controls: Refresh and Live Updates */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            variant="outline"
            size="sm"
            className="min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={toggleLiveUpdates}
            variant={liveUpdatesEnabled ? "default" : "outline"}
            size="sm"
            className="min-h-[44px]"
          >
            {liveUpdatesEnabled ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Updates
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Updates
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Last updated:</span>
          <Badge variant="outline" className="font-mono">
            {formatLastUpdated(lastUpdated)}
          </Badge>
        </div>
      </div>

      {/* BNB Balance Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle>BNB Balance</CardTitle>
            </div>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <CardDescription>Native BNB held in vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && !bnbBalance ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <>
              <div className="text-3xl font-bold text-primary">
                {bnbBalance} BNB
              </div>
              
              {/* Valuation */}
              {bnbValuation?.usdValue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>≈ ${bnbValuation.usdValue}</span>
                  {isLoadingPrices && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
              )}

              {/* Fallback notice */}
              {bnbFallbackUsed && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    BNB balance shown from on-chain address balance fallback
                  </AlertDescription>
                </Alert>
              )}

              {/* Error notice (but keep balance visible) */}
              {bnbError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {bnbError}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>BEP20 tokens held in vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && tokenBalances.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : tokenBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tokens added yet</p>
              <p className="text-sm">Add a token address below to start tracking</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokenBalances.map((token) => {
                const valuation = tokenValuations.get(token.address);
                
                return (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{token.symbol}</span>
                        {token.error && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {token.balance}
                      </div>
                      
                      {/* Token valuation */}
                      {valuation && valuation.usdValue && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>≈ ${valuation.usdValue}</span>
                          {valuation.bnbValue && (
                            <span className="text-xs">({valuation.bnbValue} BNB)</span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {getTokenLabel(token.address) || token.address}
                      </div>
                      
                      {token.error && (
                        <div className="text-xs text-destructive mt-1">
                          {token.error}
                        </div>
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

          {/* Add Token Form */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Token to Watch List</span>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label htmlFor="token-address" className="text-xs">
                  Token Contract Address
                </Label>
                <Input
                  id="token-address"
                  placeholder="0x..."
                  value={newTokenAddress}
                  onChange={(e) => setNewTokenAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="token-label" className="text-xs">
                  Label (optional)
                </Label>
                <Input
                  id="token-label"
                  placeholder="e.g., USDT, BUSD, etc."
                  value={newTokenLabel}
                  onChange={(e) => setNewTokenLabel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-sm"
                />
              </div>
              
              <Button
                onClick={handleAddToken}
                disabled={isAddingToken || !newTokenAddress.trim()}
                className="w-full min-h-[44px]"
              >
                {isAddingToken ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Token
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
