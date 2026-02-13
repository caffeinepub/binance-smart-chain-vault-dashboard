import { ExternalLink, Copy, Shield, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultInfo } from '@/hooks/useVaultInfo';
import { toast } from 'sonner';

const CONTRACT_ADDRESS = '0xd2e7DA1e8E2cda1512A5CC9d1C477D95599f0eC4';
const BSC_SCAN_URL = `https://bscscan.com/address/${CONTRACT_ADDRESS}`;

export default function ContractInfo() {
  const { owner, isLoading } = useVaultInfo();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-chart-4" />
            Contract Information
          </CardTitle>
          <CardDescription>
            Details about the BSC vault smart contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Contract Address</p>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {CONTRACT_ADDRESS}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => copyToClipboard(CONTRACT_ADDRESS, 'Contract address')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a
                href={BSC_SCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on BscScan
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Owner Address */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Contract Owner</p>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {owner || 'Unable to fetch owner'}
                </code>
                {owner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(owner, 'Owner address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Only the owner can withdraw funds from the vault
            </p>
          </div>

          {/* Network Info */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Network</p>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Binance Smart Chain</span>
                <Badge variant="secondary">Chain ID: 56</Badge>
              </div>
            </div>
          </div>

          {/* Contract Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Functions</p>
            <div className="grid gap-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">bnbBalance()</p>
                <p className="text-xs text-muted-foreground">View BNB balance in vault</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">tokenBalance(address)</p>
                <p className="text-xs text-muted-foreground">View token balance for any BEP20 token</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">depositToken(address, uint256)</p>
                <p className="text-xs text-muted-foreground">Deposit BEP20 tokens into vault</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">withdrawBNB(address, uint256)</p>
                <p className="text-xs text-muted-foreground">Withdraw BNB from vault (owner only)</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">withdrawToken(address, address, uint256)</p>
                <p className="text-xs text-muted-foreground">Withdraw tokens from vault (owner only)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
