import { useState } from 'react';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from 'sonner';

export default function WithdrawForm() {
  const { withdrawBNB, withdrawToken, isWithdrawing } = useVaultOperations();
  const { account } = useWeb3();
  
  // BNB withdrawal state
  const [bnbAmount, setBnbAmount] = useState('');
  const [bnbRecipient, setBnbRecipient] = useState('');

  // Token withdrawal state
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenRecipient, setTokenRecipient] = useState('');

  const handleWithdrawBNB = async () => {
    const recipient = bnbRecipient || account;
    
    if (!recipient || !recipient.startsWith('0x')) {
      toast.error('Please enter a valid recipient address');
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

    if (!tokenAddress || !tokenAddress.startsWith('0x')) {
      toast.error('Please enter a valid token address');
      return;
    }

    if (!recipient || !recipient.startsWith('0x')) {
      toast.error('Please enter a valid recipient address');
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
              <div className="space-y-2">
                <Label htmlFor="withdrawTokenAddress">Token Contract Address</Label>
                <Input
                  id="withdrawTokenAddress"
                  placeholder="0x... (BEP20 Token Address)"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="font-mono text-sm"
                  disabled={isWithdrawing}
                />
              </div>

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
  );
}
