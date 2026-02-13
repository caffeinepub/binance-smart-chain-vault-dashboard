import { useState } from 'react';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { toast } from 'sonner';

export default function DepositForm() {
  const { depositToken, isDepositing } = useVaultOperations();
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleDeposit = async () => {
    if (!tokenAddress || !tokenAddress.startsWith('0x')) {
      toast.error('Please enter a valid token address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await depositToken(tokenAddress, amount);
      setTokenAddress('');
      setAmount('');
      toast.success('Deposit successful!');
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-chart-2" />
          Deposit Tokens
        </CardTitle>
        <CardDescription>
          Deposit BEP20 tokens into the vault contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Important:</strong> The deposit process will first approve the vault contract to spend your tokens, then deposit them.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depositTokenAddress">Token Contract Address</Label>
            <Input
              id="depositTokenAddress"
              placeholder="0x... (BEP20 Token Address)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="font-mono text-sm"
              disabled={isDepositing}
            />
            <p className="text-xs text-muted-foreground">
              Enter the contract address of the BEP20 token you want to deposit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Amount</Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isDepositing}
              min="0"
              step="any"
            />
            <p className="text-xs text-muted-foreground">
              Amount of tokens to deposit (in token units)
            </p>
          </div>

          <Button
            onClick={handleDeposit}
            disabled={isDepositing || !tokenAddress || !amount}
            className="w-full min-h-[44px]"
            size="lg"
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Depositing...
              </>
            ) : (
              <>
                <ArrowDownToLine className="mr-2 h-5 w-5" />
                Deposit Tokens
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
          <p className="font-semibold">Steps to deposit:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Enter the token contract address</li>
            <li>Enter the amount to deposit</li>
            <li>Approve the transaction in MetaMask (approval)</li>
            <li>Confirm the second transaction (deposit)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
