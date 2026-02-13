import { useState } from 'react';
import { ArrowUpFromLine, Loader2, Coins, AlertCircle, Info, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useWeb3 } from '@/hooks/useWeb3';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useTxHistory } from '@/hooks/useTxHistory';
import TokenSelectorInput from '@/components/TokenSelectorInput';
import TransactionHistory from '@/components/TransactionHistory';
import { normalizeAddress } from '@/lib/evm';
import { toast } from 'sonner';

interface WithdrawFormProps {
  vaultBalances: ReturnType<typeof import('@/hooks/useVaultBalances').useVaultBalances>;
  isConnected: boolean;
  isWrongNetwork: boolean;
  onSwitchNetwork: () => void;
  isSwitching: boolean;
}

export default function WithdrawForm({ vaultBalances, isConnected, isWrongNetwork, onSwitchNetwork, isSwitching }: WithdrawFormProps) {
  const { withdrawBNB, withdrawToken, isWithdrawing } = useVaultOperations();
  const { account } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { getDropdownOptions } = useSavedTokenCatalog();
  const { addEntry } = useTxHistory();
  
  // BNB withdrawal state
  const [bnbAmount, setBnbAmount] = useState('');
  const [bnbRecipient, setBnbRecipient] = useState('');

  // Token withdrawal state
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenRecipient, setTokenRecipient] = useState('');

  const [showHistory, setShowHistory] = useState(false);

  const { bnbBalance, bnbError, isLoading: isLoadingBalance } = vaultBalances;

  const tokenOptions = getDropdownOptions(watchedTokens);

  const handleWithdrawBNB = async () => {
    const recipient = bnbRecipient || account;
    
    // Validate recipient address
    try {
      if (!recipient) {
        toast.error('Please enter a valid recipient address');
        return;
      }
      normalizeAddress(recipient);
    } catch (error: any) {
      toast.error(error.message || 'Invalid recipient address');
      return;
    }

    if (!bnbAmount || parseFloat(bnbAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const txHash = await withdrawBNB(recipient, bnbAmount);
      
      // Add to history
      addEntry('Withdraw BNB', 'BNB', bnbAmount, txHash);
      
      setBnbAmount('');
      setBnbRecipient('');
      toast.success('BNB withdrawal transaction submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed. Please try again.');
    }
  };

  const handleWithdrawToken = async () => {
    const recipient = tokenRecipient || account;

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

    // Validate recipient address
    try {
      if (!recipient) {
        toast.error('Please enter a valid recipient address');
        return;
      }
      normalizeAddress(recipient);
    } catch (error: any) {
      toast.error(error.message || 'Invalid recipient address');
      return;
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const txHash = await withdrawToken(tokenAddress, recipient, tokenAmount);
      
      // Add to history
      addEntry('Withdraw Token', tokenAddress, tokenAmount, txHash);
      
      setTokenAddress('');
      setTokenAmount('');
      setTokenRecipient('');
      toast.success('Token withdrawal transaction submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed. Please try again.');
    }
  };

  const canWithdraw = isConnected && !isWrongNetwork;

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
            Please connect your wallet to withdraw tokens from the vault.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && isWrongNetwork && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Please switch to Binance Smart Chain (BSC) to perform withdrawals.</p>
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

      {/* Withdraw Form */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-primary" />
                Withdraw Funds
              </CardTitle>
              <CardDescription>
                Withdraw BNB or BEP20 tokens from the vault
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
        <CardContent>
          <Tabs defaultValue="bnb" className="w-full">
            <TabsList className="grid w-full grid-cols-2 min-h-[44px] bg-primary/10 border border-primary/20">
              <TabsTrigger value="bnb" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-1 data-[state=active]:text-primary-foreground">
                Withdraw BNB
              </TabsTrigger>
              <TabsTrigger value="token" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-1 data-[state=active]:text-primary-foreground">
                Withdraw Token
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bnb" className="space-y-4 mt-4">
              <Alert className="border-primary/30 bg-primary/5">
                <AlertDescription className="text-sm">
                  Only the vault owner can withdraw funds from the contract.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bnbRecipient">Recipient Address (Optional)</Label>
                  <Input
                    id="bnbRecipient"
                    placeholder={`${account?.slice(0, 6)}...${account?.slice(-4)} (Your wallet)`}
                    value={bnbRecipient}
                    onChange={(e) => setBnbRecipient(e.target.value)}
                    className="font-mono text-sm"
                    disabled={!canWithdraw || isWithdrawing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to withdraw to your connected wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bnbAmount">Amount (BNB)</Label>
                  <Input
                    id="bnbAmount"
                    type="number"
                    placeholder="0.0"
                    value={bnbAmount}
                    onChange={(e) => setBnbAmount(e.target.value)}
                    disabled={!canWithdraw || isWithdrawing}
                    min="0"
                    step="any"
                  />
                </div>

                <Button
                  onClick={handleWithdrawBNB}
                  disabled={!canWithdraw || isWithdrawing || !bnbAmount}
                  className="w-full min-h-[44px] bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg"
                  size="lg"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="mr-2 h-5 w-5" />
                      Withdraw BNB
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="token" className="space-y-4 mt-4">
              <Alert className="border-primary/30 bg-primary/5">
                <AlertDescription className="text-sm">
                  Only the vault owner can withdraw funds from the contract.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <TokenSelectorInput
                  label="Token Contract Address"
                  placeholder="0x... (BEP20 Token Address)"
                  value={tokenAddress}
                  onChange={setTokenAddress}
                  disabled={!canWithdraw || isWithdrawing}
                  options={tokenOptions}
                  helperText="Select a saved token or enter a contract address manually"
                  id="withdrawTokenAddress"
                />

                <div className="space-y-2">
                  <Label htmlFor="tokenRecipient">Recipient Address (Optional)</Label>
                  <Input
                    id="tokenRecipient"
                    placeholder={`${account?.slice(0, 6)}...${account?.slice(-4)} (Your wallet)`}
                    value={tokenRecipient}
                    onChange={(e) => setTokenRecipient(e.target.value)}
                    className="font-mono text-sm"
                    disabled={!canWithdraw || isWithdrawing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to withdraw to your connected wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenAmount">Amount</Label>
                  <Input
                    id="tokenAmount"
                    type="number"
                    placeholder="0.0"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    disabled={!canWithdraw || isWithdrawing}
                    min="0"
                    step="any"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount of tokens to withdraw (in token units)
                  </p>
                </div>

                <Button
                  onClick={handleWithdrawToken}
                  disabled={!canWithdraw || isWithdrawing || !tokenAddress || !tokenAmount}
                  className="w-full min-h-[44px] bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg"
                  size="lg"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="mr-2 h-5 w-5" />
                      Withdraw Token
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {showHistory && <TransactionHistory />}
    </div>
  );
}
