import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  error: string | null;
  isInitializing: boolean;
  hasMetaMask: boolean;
  isMobile: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBSC: () => Promise<void>;
  callContract: (to: string, data: string) => Promise<string>;
  sendTransaction: (to: string, data: string, value?: string) => Promise<string>;
  getNativeBalance: (address: string) => Promise<bigint>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = '0x38';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // V14: Connected if wallet is connected, regardless of chain
  const isConnected = !!account;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  const switchToBSC = async () => {
    if (!window.ethereum) {
      throw new Error('EVM wallet is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_CHAIN_ID_HEX,
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: [BSC_RPC_URL],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add BSC network');
        }
      } else {
        throw switchError;
      }
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);

      if (!window.ethereum) {
        if (isMobile) {
          setError('Please open this app in your wallet app\'s built-in browser');
        } else {
          setError('EVM wallet is not installed. Please install MetaMask or another EVM wallet to use this app.');
        }
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please connect your wallet.');
        return;
      }

      setAccount(accounts[0]);
      
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(currentChainId, 16);
      setChainId(chainIdNum);
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  /**
   * Extract a readable error message from nested provider error structures
   */
  const extractErrorMessage = (error: any): string => {
    // Handle raw 0x responses
    if (typeof error === 'string' && (error === '0x' || error.trim() === '0x')) {
      return 'Contract call reverted. The contract may not support this function.';
    }

    // Try to extract nested error messages from provider responses
    if (error?.data?.message) {
      return error.data.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      // Clean up common error prefixes
      let msg = error.message;
      
      // Handle 0x in message
      if (msg === '0x' || msg.trim() === '0x') {
        return 'Contract call reverted. The contract may not support this function.';
      }
      
      if (msg.includes('execution reverted:')) {
        const parts = msg.split('execution reverted:');
        if (parts[1]?.trim()) {
          return parts[1].trim();
        }
        return 'Contract execution reverted. Try again or check network connection.';
      }
      
      // Network errors
      if (msg.includes('network') || msg.includes('fetch')) {
        return 'Network error. Check your connection and try again.';
      }
      
      return msg;
    }
    return 'Contract call failed. Try again or check network connection.';
  };

  /**
   * Fallback method to call contract via direct JSON-RPC when wallet fails
   */
  const callContractViaRPC = async (to: string, data: string): Promise<string> => {
    try {
      const response = await fetch(BSC_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to,
              data,
            },
            'latest',
          ],
        }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(extractErrorMessage(json.error));
      }

      if (!json.result) {
        throw new Error('No result returned from RPC call');
      }

      // Check for 0x result which indicates revert
      if (json.result === '0x' || json.result.trim() === '0x') {
        throw new Error('Contract call reverted. The contract may not support this function.');
      }

      return json.result;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  /**
   * Get native balance via eth_getBalance
   * Uses injected provider if available, falls back to direct RPC
   */
  const getNativeBalance = async (address: string): Promise<bigint> => {
    try {
      // Try injected provider first if available
      if (window.ethereum) {
        try {
          const result = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          return BigInt(result);
        } catch (providerError: any) {
          console.warn('Injected provider eth_getBalance failed, falling back to RPC:', providerError);
          // Fall through to RPC fallback
        }
      }

      // Fallback to direct RPC call
      const response = await fetch(BSC_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error('RPC temporarily unavailable. Try again in a moment.');
      }

      if (!json.result) {
        throw new Error('No balance returned from RPC');
      }

      return BigInt(json.result);
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  /**
   * Call a contract method (read-only)
   * Uses injected provider if available, falls back to direct RPC
   */
  const callContract = async (to: string, data: string): Promise<string> => {
    try {
      // Try injected provider first if available
      if (window.ethereum) {
        try {
          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [
              {
                to,
                data,
              },
              'latest',
            ],
          });
          
          // Check for 0x result which indicates revert
          if (result === '0x' || result.trim() === '0x') {
            throw new Error('Contract call reverted. The contract may not support this function.');
          }
          
          return result;
        } catch (providerError: any) {
          console.warn('Injected provider eth_call failed, falling back to RPC:', providerError);
          // Fall through to RPC fallback
        }
      }

      // Fallback to direct RPC call
      return await callContractViaRPC(to, data);
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  /**
   * Send a transaction (state-changing)
   * Requires connected wallet
   */
  const sendTransaction = async (to: string, data: string, value: string = '0x0'): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('EVM wallet is not installed');
    }

    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to,
            data,
            value,
          },
        ],
      });

      return txHash;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  };

  // Initialize: check for existing connection and set up event listeners
  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          setHasMetaMask(true);

          // Check if already connected
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            setAccount(accounts[0]);

            const currentChainId = await window.ethereum.request({
              method: 'eth_chainId',
            });
            setChainId(parseInt(currentChainId, 16));
          }
        } else {
          setHasMetaMask(false);
        }
      } catch (err) {
        console.error('Error initializing Web3:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Set up event listeners after initialization
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    const handleConnect = async (connectInfo: { chainId: string }) => {
      // Update chainId when wallet connects
      setChainId(parseInt(connectInfo.chainId, 16));
      
      // Fetch accounts
      try {
        const accounts = await window.ethereum!.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Error fetching accounts on connect:', err);
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [disconnectWallet]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected,
        error,
        isInitializing,
        hasMetaMask,
        isMobile,
        connectWallet,
        disconnectWallet,
        switchToBSC,
        callContract,
        sendTransaction,
        getNativeBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
