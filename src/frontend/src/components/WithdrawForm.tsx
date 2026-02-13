import { useState } from 'react';
import { ArrowUpFromLine, Loader2, Coins, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useWeb3 } from '@/hooks/useWeb3';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import TokenSelectorInput from '@/components/TokenSelectorInput';
import { normalizeAddress } from '@/lib/evm';
import { toast } from 'sonner';

interface WithdrawFormProps {
  vaultBalances: ReturnType<typeof import('@/hooks/useVaultBalances').useVaultBalances>;
}

export default function WithdrawForm({ vaultBalances }: WithdrawFormProps) {
  const { withdrawBNB, withdrawToken, isWithdrawing } = useVaultOperations();
  const { account } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { getDropdownOptions } = useSavedTokenCatalog();
  
  // BNB withdrawal state
  const [bnbAmount, setBnbAmount] = useState('');
  const [bnbRecipient, setBnbRecipient] = useState('');

  // Token withdrawal state
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenRecipient, setTokenRecipient] = useState('');

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
      await withdrawBNB(recipient, bnbAmount);
      setBnbAmount('');
      setBnbRecipient('');
      toast.success('BNB withdrawal successful!');
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
      await withdrawToken(tokenAddress, recipient, tokenAmount);
      setTokenAddress('');
      setTokenAmount('');
      setTokenRecipient('');
      toast.success('Token withdrawal successful!');
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Vault BNB Balance Display */}
      <Card className="border-chart-1/30 bg-gradient-to-br from-chart-1/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 text-chart-1" />
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
            <p className="text-2xl font-bold">{bnbBalance} BNB</p>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-chart-3" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>
            Withdraw BNB or BEP20 tokens from the vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bnb" className="w-full">
            <TabsList className="grid w-full grid-cols-2 min-h-[44px]">
              <TabsTrigger value="bnb">Withdraw BNB</TabsTrigger>
              <TabsTrigger value="token">Withdraw Token</TabsTrigger>
            </TabsList>

            <TabsContent value="bnb" className="space-y-4 mt-4">
              <Alert>
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
                    disabled={isWithdrawing}
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
                    disabled={isWithdrawing}
                    min="0"
                    step="any"
                  />
                </div>

                <Button
                  onClick={handleWithdrawBNB}
                  disabled={isWithdrawing || !bnbAmount}
                  className="w-full min-h-[44px]"
                  size="lg"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Withdrawing...
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
              <Alert>
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
                  disabled={isWithdrawing}
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
                    disabled={isWithdrawing}
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
                    disabled={isWithdrawing}
                    min="0"
                    step="any"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount of tokens to withdraw (in token units)
                  </p>
                </div>

                <Button
                  onClick={handleWithdrawToken}
                  disabled={isWithdrawing || !tokenAddress || !tokenAmount}
                  className="w-full min-h-[44px]"
                  size="lg"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Withdrawing...
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
    </div>
  );
}
