import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  const isConnected = !!account && chainId === BSC_CHAIN_ID;

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
      throw new Error('MetaMask is not installed');
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
          setError('Please open this app in the MetaMask mobile app browser');
        } else {
          setError('MetaMask is not installed. Please install MetaMask to use this app.');
        }
        return;
      }

      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(currentChainId, 16);

      if (chainIdNum !== BSC_CHAIN_ID) {
        await switchToBSC();
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please connect your wallet.');
        return;
      }

      setAccount(accounts[0]);
      setChainId(BSC_CHAIN_ID);
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setError(null);
  };

  /**
   * Canonical method to call a contract (eth_call)
   */
  const callContract = async (to: string, data: string): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

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
      return result;
    } catch (error: any) {
      console.error('Contract call error:', error);
      throw new Error(error.message || 'Contract call failed');
    }
  };

  /**
   * Canonical method to send a transaction (eth_sendTransaction)
   */
  const sendTransaction = async (to: string, data: string, value?: string): Promise<string> => {
    if (!window.ethereum || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txParams: any = {
        from: account,
        to,
        data,
      };

      if (value) {
        txParams.value = value;
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      return txHash;
    } catch (error: any) {
      console.error('Transaction error:', error);
      throw new Error(error.message || 'Transaction failed');
    }
  };

  // Initialize and check for MetaMask
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if MetaMask is available
        const metamaskAvailable = typeof window.ethereum !== 'undefined';
        setHasMetaMask(metamaskAvailable);

        if (!metamaskAvailable) {
          if (isMobile) {
            setError('Please open this app in the MetaMask mobile app browser');
          } else {
            setError('MetaMask is not installed. Please install MetaMask browser extension to use this app.');
          }
          setIsInitializing(false);
          return;
        }

        // Check if already connected
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const chainIdNum = parseInt(currentChainId, 16);

            setAccount(accounts[0]);
            setChainId(chainIdNum);

            if (chainIdNum !== BSC_CHAIN_ID) {
              setError('Please switch to Binance Smart Chain network');
            }
          }
        } catch (err) {
          console.error('Error checking existing connection:', err);
          // Don't set error here, just log it
        }
      } catch (err) {
        console.error('Error during Web3 initialization:', err);
        setError('Failed to initialize Web3. Please refresh the page.');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isMobile]);

  // Set up event listeners
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
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      
      if (newChainId !== BSC_CHAIN_ID) {
        setError('Please switch to Binance Smart Chain network');
      } else {
        setError(null);
      }
    };

    try {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    } catch (err) {
      console.error('Error setting up event listeners:', err);
    }
  }, []);

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

declare global {
  interface Window {
    ethereum?: any;
  }
}
