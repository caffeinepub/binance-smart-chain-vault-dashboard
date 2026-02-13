import { useState } from 'react';
import { ArrowDownToLine, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useVaultBalances } from '@/hooks/useVaultBalances';
import { TokenSelectorInput } from '@/components/TokenSelectorInput';
import TransactionHistory from '@/components/TransactionHistory';
import { useTxHistory } from '@/hooks/useTxHistory';
import { toast } from 'sonner';
import { useWeb3 } from '@/hooks/useWeb3';

interface DepositFormProps {
  onSuccess?: () => void;
}

export function DepositForm({ onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { depositToken } = useVaultOperations();
  const { bnbBalance, tokenBalances } = useVaultBalances(false);
  const { addEntry } = useTxHistory();
  const { sendTransaction } = useWeb3();

  const handleDepositBnb = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      // For BNB deposit, send value directly to vault contract
      const txHash = await sendTransaction('0xd2e7DA1e8E2cda1512A5CC9d1C477D95599f0eC4', '0x', amount);
      toast.success('BNB deposit initiated');
      
      // Add to history
      addEntry('Deposit Token', 'BNB', amount, txHash);

      setAmount('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err.message || 'Failed to deposit BNB');
      toast.error(err.message || 'Failed to deposit BNB');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDepositToken = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!tokenAddress || !tokenAddress.startsWith('0x')) {
      setError('Please enter a valid token address');
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      const txHash = await depositToken(tokenAddress, amount);
      toast.success('Token deposit initiated');

      // Find token symbol for history
      const token = tokenBalances.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      const symbol = token?.symbol || tokenAddress.slice(0, 8);

      // Add to history
      addEntry('Deposit Token', symbol, amount, txHash);

      setAmount('');
      setTokenAddress('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Token deposit failed:', err);
      setError(err.message || 'Failed to deposit token');
      toast.error(err.message || 'Failed to deposit token');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vault Balance Display */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="text-sm text-muted-foreground mb-1">Current Vault Balance</div>
        <div className="text-2xl font-bold font-mono text-primary">
          {parseFloat(bnbBalance).toFixed(6)} BNB
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* BNB Deposit */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Deposit BNB</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bnb-amount">Amount (BNB)</Label>
          <Input
            id="bnb-amount"
            type="number"
            step="0.000001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isDepositing}
          />
        </div>
        <Button
          onClick={handleDepositBnb}
          disabled={isDepositing || !amount}
          className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isDepositing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Depositing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Deposit BNB
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Token Deposit */}
      <div className="space-y-4">
        <h3 className="font-semibold">Deposit BEP20 Token</h3>
        <TokenSelectorInput
          value={tokenAddress}
          onChange={setTokenAddress}
          label="Token Address"
          placeholder="Select or enter token address"
          disabled={isDepositing}
        />
        <div className="space-y-2">
          <Label htmlFor="token-amount">Amount</Label>
          <Input
            id="token-amount"
            type="number"
            step="0.000001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isDepositing}
          />
        </div>
        <Button
          onClick={handleDepositToken}
          disabled={isDepositing || !amount || !tokenAddress}
          className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isDepositing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Depositing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Deposit Token
            </>
          )}
        </Button>
      </div>

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
