import { useState } from 'react';
import { ArrowUpFromLine, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { TokenSelectorInput } from '@/components/TokenSelectorInput';
import TransactionHistory from '@/components/TransactionHistory';
import { useTxHistory } from '@/hooks/useTxHistory';
import { toast } from 'sonner';
import { useWeb3 } from '@/hooks/useWeb3';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

export function WithdrawForm({ onSuccess }: WithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { withdrawBNB, withdrawToken } = useVaultOperations();
  const { addEntry } = useTxHistory();
  const { account } = useWeb3();

  const handleWithdrawBnb = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!account) {
      setError('Wallet not connected');
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      const txHash = await withdrawBNB(account, amount);
      toast.success('BNB withdrawal initiated');

      // Add to history
      addEntry('Withdraw BNB', 'BNB', amount, txHash);

      setAmount('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setError(err.message || 'Failed to withdraw BNB');
      toast.error(err.message || 'Failed to withdraw BNB');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawToken = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!tokenAddress || !tokenAddress.startsWith('0x')) {
      setError('Please enter a valid token address');
      return;
    }

    if (!account) {
      setError('Wallet not connected');
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      const txHash = await withdrawToken(tokenAddress, account, amount);
      toast.success('Token withdrawal initiated');

      // Use shortened address as fallback label for history
      const symbol = tokenAddress.slice(0, 10) + '...';

      // Add to history
      addEntry('Withdraw Token', symbol, amount, txHash);

      setAmount('');
      setTokenAddress('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Token withdrawal failed:', err);
      setError(err.message || 'Failed to withdraw token');
      toast.error(err.message || 'Failed to withdraw token');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="bnb" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bnb">BNB</TabsTrigger>
          <TabsTrigger value="token">BEP20 Token</TabsTrigger>
        </TabsList>

        <TabsContent value="bnb" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="bnb-withdraw-amount">Amount (BNB)</Label>
            <Input
              id="bnb-withdraw-amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isWithdrawing}
            />
          </div>
          <Button
            onClick={handleWithdrawBnb}
            disabled={isWithdrawing || !amount}
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              <>
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw BNB
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="token" className="space-y-4 mt-4">
          <TokenSelectorInput
            value={tokenAddress}
            onChange={setTokenAddress}
            label="Token Address"
            placeholder="Select or enter token address"
            disabled={isWithdrawing}
          />
          <div className="space-y-2">
            <Label htmlFor="token-withdraw-amount">Amount</Label>
            <Input
              id="token-withdraw-amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isWithdrawing}
            />
          </div>
          <Button
            onClick={handleWithdrawToken}
            disabled={isWithdrawing || !amount || !tokenAddress}
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              <>
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw Token
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Transaction History Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full gap-2"
      >
        <History className="h-4 w-4" />
        {showHistory ? 'Hide' : 'Show'} Transaction History
      </Button>

      {showHistory && <TransactionHistory />}
    </div>
  );
}
