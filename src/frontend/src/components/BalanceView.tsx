import { useState } from 'react';
import { RefreshCw, Plus, Coins, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useVaultBalances } from '@/hooks/useVaultBalances';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { toast } from 'sonner';

export default function BalanceView() {
  const { bnbBalance, tokenBalances, isLoading, refetch } = useVaultBalances();
  const { tokens: watchedTokens, addToken, removeToken } = useWatchedTokens();
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);

  const handleRefresh = async () => {
    toast.promise(refetch(), {
      loading: 'Refreshing balances...',
      success: 'Balances updated',
      error: 'Failed to refresh balances',
    });
  };

  const handleAddToken = () => {
    if (!newTokenAddress || !newTokenAddress.startsWith('0x')) {
      toast.error('Please enter a valid token address');
      return;
    }
    
    setIsAddingToken(true);
    try {
      const added = addToken(newTokenAddress);
      if (added) {
        toast.success('Token added to watch list');
        setNewTokenAddress('');
        // Trigger refetch after a short delay
        setTimeout(() => refetch(), 500);
      } else {
        toast.info('Token is already in watch list');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid token address');
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleRemoveToken = (address: string) => {
    removeToken(address);
    toast.success('Token removed from watch list');
  };

  return (
    <div className="space-y-6">
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
              disabled={isLoading}
              className="rounded-full min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold">{bnbBalance} BNB</p>
              <p className="text-sm text-muted-foreground">Binance Coin</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <CardTitle>BEP20 Token Balances</CardTitle>
          <CardDescription>View balances of BEP20 tokens in the vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Token Input */}
          <div className="space-y-2">
            <Label htmlFor="tokenAddress">Add Token to Watch</Label>
            <div className="flex gap-2">
              <Input
                id="tokenAddress"
                placeholder="0x... (Token Contract Address)"
                value={newTokenAddress}
                onChange={(e) => setNewTokenAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleAddToken}
                disabled={isAddingToken || !newTokenAddress}
                size="icon"
                className="shrink-0 min-h-[44px] min-w-[44px]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : watchedTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tokens added yet</p>
                <p className="text-sm mt-1">Add a token address above to view its balance</p>
              </div>
            ) : (
              tokenBalances.map((token, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{token.symbol || 'Unknown'}</p>
                          <Badge variant="outline" className="text-xs">
                            BEP20
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {token.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold">{token.balance}</p>
                          <p className="text-xs text-muted-foreground">{token.symbol}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveToken(token.address)}
                          className="shrink-0 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
