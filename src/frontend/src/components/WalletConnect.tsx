import { useState } from 'react';
import { Wallet, AlertCircle, ExternalLink, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/hooks/useWeb3';

export default function WalletConnect() {
  const { connectWallet, switchToBSC, error, hasMetaMask, isMobile, chainId, account, isInitializing } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const BSC_CHAIN_ID = 56;
  const isWrongNetwork = account && chainId !== null && chainId !== BSC_CHAIN_ID;

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

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Checking Wallet Connection</h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we check for an existing wallet connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If wallet is not available on mobile, show mobile-specific instructions
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
            <h2 className="text-2xl font-bold">Open in Wallet Browser</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              To use this dApp on mobile, open it inside your wallet app's built-in browser.
            </p>
          </div>

          <div className="pt-4 space-y-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="font-semibold">Supported wallets:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>MetaMask</li>
                <li>Trust Wallet</li>
                <li>SafePal</li>
                <li>TokenPocket</li>
                <li>Other EVM-compatible wallets</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="font-semibold">Steps to access:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Open your wallet app</li>
                <li>Tap the browser icon</li>
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

  // If wallet is not available on desktop
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
            <h2 className="text-2xl font-bold">EVM Wallet Required</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This application requires an EVM-compatible wallet extension to connect to the Binance Smart Chain network.
            </p>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Supported: MetaMask, Trust Wallet, SafePal, TokenPocket, and other injected EVM wallets
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
            <p>After installing your wallet:</p>
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

  // If account exists but chainId is still null (shouldn't happen often but handle it)
  if (account && chainId === null) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Detecting Network</h2>
            <p className="text-muted-foreground text-sm">
              Checking which network you're connected to...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: show connect button
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
            Connect your EVM wallet to access the BSC Vault Dashboard
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
          <p>• Make sure your wallet is installed</p>
          <p>• Switch to Binance Smart Chain network</p>
          <p>• Approve the connection request</p>
        </div>
      </div>
    </div>
  );
}
