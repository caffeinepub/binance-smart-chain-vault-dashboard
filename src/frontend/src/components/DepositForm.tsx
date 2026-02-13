import { useState } from 'react';
import { ArrowDownToLine, Loader2, Coins, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import TokenSelectorInput from '@/components/TokenSelectorInput';
import { normalizeAddress } from '@/lib/evm';
import { toast } from 'sonner';

interface DepositFormProps {
  vaultBalances: ReturnType<typeof import('@/hooks/useVaultBalances').useVaultBalances>;
}

export default function DepositForm({ vaultBalances }: DepositFormProps) {
  const { depositToken, isDepositing } = useVaultOperations();
  const { tokens: watchedTokens } = useWatchedTokens();
  const { getDropdownOptions } = useSavedTokenCatalog();
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');

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
      await depositToken(tokenAddress, amount);
      setTokenAddress('');
      setAmount('');
      toast.success('Deposit successful!');
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed. Please try again.');
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

      {/* Deposit Form */}
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
            <TokenSelectorInput
              label="Token Contract Address"
              placeholder="0x... (BEP20 Token Address)"
              value={tokenAddress}
              onChange={setTokenAddress}
              disabled={isDepositing}
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
              <li>Select or enter the token contract address</li>
              <li>Enter the amount to deposit</li>
              <li>Approve the transaction in your wallet (approval)</li>
              <li>Confirm the second transaction (deposit)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
