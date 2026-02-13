import { useState } from 'react';
import { Wallet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';

const BSC_CHAIN_ID = 56;

export function WalletConnectTopBar() {
  const { connectWallet, switchToBSC, account, chainId, isInitializing, hasMetaMask } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const isWrongNetwork = account && chainId !== null && chainId !== BSC_CHAIN_ID;
  const isConnected = !!account;
  const isOnBSC = chainId === BSC_CHAIN_ID;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchToBSC();
    } catch (err) {
      console.error('Failed to switch network:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  // Initializing state
  if (isInitializing) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">Checking wallet...</span>
      </div>
    );
  }

  // No wallet detected
  if (!hasMetaMask) {
    return (
      <Alert className="py-2 px-3 border-destructive/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <span className="hidden sm:inline">Wallet not detected</span>
          <span className="sm:hidden">No wallet</span>
        </AlertDescription>
      </Alert>
    );
  }

  // Wrong network
  if (isWrongNetwork) {
    return (
      <Button
        onClick={handleSwitchNetwork}
        disabled={isSwitching}
        size="sm"
        variant="destructive"
        className="gap-2"
      >
        {isSwitching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Switching...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Switch to BSC</span>
            <span className="sm:hidden">Wrong Network</span>
          </>
        )}
      </Button>
    );
  }

  // Connected and on BSC
  if (isConnected && isOnBSC) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 bg-primary/10 border-primary/20">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          <span className="hidden sm:inline">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <span className="sm:hidden">Connected</span>
        </Badge>
      </div>
    );
  }

  // Detecting network (connected but chainId is null)
  if (account && chainId === null) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">Detecting network...</span>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="sm"
      className="gap-2"
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </Button>
  );
}
