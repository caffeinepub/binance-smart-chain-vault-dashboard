import { useState } from 'react';
import { ArrowDownToLine, Loader2, Coins, AlertCircle, Info, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useTxHistory } from '@/hooks/useTxHistory';
import TokenSelectorInput from '@/components/TokenSelectorInput';
import TransactionHistory from '@/components/TransactionHistory';
import { normalizeAddress } from '@/lib/evm';
import { toast } from 'sonner';

interface DepositFormProps {
  vaultBalances: ReturnType<typeof import('@/hooks/useVaultBalances').useVaultBalances>;
  isConnected: boolean;
  isWrongNetwork: boolean;
  onSwitchNetwork: () => void;
  isSwitching: boolean;
}

export default function DepositForm({ vaultBalances, isConnected, isWrongNetwork, onSwitchNetwork, isSwitching }: DepositFormProps) {
  const { depositToken, isDepositing } = useVaultOperations();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { getDropdownOptions } = useSavedTokenCatalog();
  const { addEntry } = useTxHistory();
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { bnbBalance, bnbError, isLoading: isLoadingBalance } = vaultBalances;

  const tokenOptions = getDropdownOptions(watchedTokens);

  const handleDeposit = async () => {
    // Validate token address
    try {
      if (!tokenAddress) {
        toast.error('Please select or enter a token address');
        return;
      }
      normalizeAddress(tokenAddress);
    } catch (error: any) {
      toast.error(error.message || 'Invalid token address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const txHash = await depositToken(tokenAddress, amount);
      
      // Add to history
      addEntry('Deposit Token', tokenAddress, amount, txHash);
      
      setTokenAddress('');
      setAmount('');
      toast.success('Deposit transaction submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed. Please try again.');
    }
  };

  const canDeposit = isConnected && !isWrongNetwork;

  return (
    <div className="space-y-6">
      {/* Vault BNB Balance Display - Always visible */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-chart-1/5 to-transparent shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 text-primary" />
            Vault BNB Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBalance ? (
            <Skeleton className="h-8 w-32" />
          ) : bnbError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{bnbError}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-2xl font-bold text-primary">{bnbBalance} BNB</p>
          )}
        </CardContent>
      </Card>

      {/* Connection/Network Status Alert */}
      {!isConnected && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to deposit tokens into the vault.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && isWrongNetwork && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Please switch to Binance Smart Chain (BSC) to perform deposits.</p>
            <Button
              onClick={onSwitchNetwork}
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

      {/* Deposit Form */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
                Deposit Tokens
              </CardTitle>
              <CardDescription>
                Deposit BEP20 tokens into the vault contract
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="text-sm">
              <strong>Important:</strong> The deposit process will first approve the vault contract to spend your tokens, then deposit them.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <TokenSelectorInput
              label="Token Contract Address"
              placeholder="0x... (BEP20 Token Address)"
              value={tokenAddress}
              onChange={setTokenAddress}
              disabled={!canDeposit || isDepositing}
              options={tokenOptions}
              helperText="Select a saved token or enter a contract address manually"
              id="depositTokenAddress"
            />

            <div className="space-y-2">
              <Label htmlFor="depositAmount">Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canDeposit || isDepositing}
                min="0"
                step="any"
              />
              <p className="text-xs text-muted-foreground">
                Amount of tokens to deposit (in token units)
              </p>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!canDeposit || isDepositing || !tokenAddress || !amount}
              className="w-full min-h-[44px] bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg"
              size="lg"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Deposit...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-5 w-5" />
                  Deposit Tokens
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t border-primary/10">
            <p className="font-semibold">Steps to deposit:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Select or enter the token contract address</li>
              <li>Enter the amount to deposit</li>
              <li>Approve the transaction in your wallet (approval)</li>
              <li>Confirm the second transaction (deposit)</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {showHistory && <TransactionHistory />}
    </div>
  );
}
