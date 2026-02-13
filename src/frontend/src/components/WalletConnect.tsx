import { useState } from 'react';
import { Wallet, AlertCircle, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWeb3 } from '@/hooks/useWeb3';

export default function WalletConnect() {
  const { connectWallet, switchToBSC, error, hasMetaMask, isMobile, chainId } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const BSC_CHAIN_ID = 56;
  const isWrongNetwork = hasMetaMask && chainId !== null && chainId !== BSC_CHAIN_ID;

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

  // If MetaMask is not available on mobile, show mobile-specific instructions
  if (!hasMetaMask && isMobile) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-chart-1/10">
              <Smartphone className="h-12 w-12 text-chart-1" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Open in MetaMask Browser</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              To use this dApp on mobile, you need to open it inside the MetaMask mobile app's built-in browser.
            </p>
          </div>

          <div className="pt-4 space-y-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="font-semibold">Steps to access:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Open the MetaMask mobile app</li>
                <li>Tap the browser icon (three horizontal lines)</li>
                <li>Enter this URL in the browser</li>
                <li>Connect your wallet when prompted</li>
              </ol>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Download MetaMask
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // If MetaMask is not available on desktop
  if (!hasMetaMask) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">MetaMask Required</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This application requires MetaMask browser extension to connect to the Binance Smart Chain network.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Install MetaMask
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>

          <div className="pt-4 space-y-2 text-xs text-muted-foreground">
            <p>After installing MetaMask:</p>
            <p>• Refresh this page</p>
            <p>• Click "Connect Wallet"</p>
            <p>• Approve the connection request</p>
          </div>
        </div>
      </div>
    );
  }

  // If connected to wrong network
  if (isWrongNetwork) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-warning/10">
              <AlertCircle className="h-12 w-12 text-warning" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Wrong Network</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You're connected to the wrong network. Please switch to Binance Smart Chain (BSC) to continue.
            </p>
          </div>

          <Button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            {isSwitching ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Switching Network...
              </>
            ) : (
              'Switch to BSC Network'
            )}
          </Button>

          <div className="pt-4 text-xs text-muted-foreground">
            <p>Current Chain ID: {chainId}</p>
            <p>Required Chain ID: 56 (BSC Mainnet)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground text-sm">
            Connect your MetaMask wallet to access the BSC Vault Dashboard
          </p>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          size="lg"
          className="w-full sm:w-auto min-h-[44px]"
        >
          {isConnecting ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-4 space-y-2 text-xs text-muted-foreground">
          <p>• Make sure MetaMask is installed</p>
          <p>• Switch to Binance Smart Chain network</p>
          <p>• Approve the connection request</p>
        </div>
      </div>
    </div>
  );
}
