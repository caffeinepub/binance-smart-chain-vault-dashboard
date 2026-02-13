import { useState, useEffect, useCallback } from 'react';

export type TxType = 'Deposit Token' | 'Withdraw BNB' | 'Withdraw Token';
export type TxStatus = 'Pending' | 'Confirmed' | 'Failed';

export interface TxHistoryEntry {
  id: string;
  type: TxType;
  asset: string;
  amount: string;
  timestamp: number;
  txHash: string;
  status: TxStatus;
}

const STORAGE_KEY = 'vault_tx_history';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

export function useTxHistory() {
  const [history, setHistory] = useState<TxHistoryEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      setHistory([]);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save transaction history:', error);
    }
  }, [history]);

  // Poll for transaction receipts
  useEffect(() => {
    if (history.length === 0) return;

    const pendingTxs = history.filter(tx => tx.status === 'Pending');
    if (pendingTxs.length === 0) return;

    setIsPolling(true);

    const checkReceipt = async (txHash: string): Promise<TxStatus | null> => {
      try {
        // Try window.ethereum first if available
        if (window.ethereum) {
          try {
            const receipt = await window.ethereum.request({
              method: 'eth_getTransactionReceipt',
              params: [txHash],
            });

            if (receipt) {
              return receipt.status === '0x1' ? 'Confirmed' : 'Failed';
            }
          } catch (providerError) {
            console.warn('Provider receipt check failed, trying RPC:', providerError);
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
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        });

        const json = await response.json();

        if (json.result) {
          return json.result.status === '0x1' ? 'Confirmed' : 'Failed';
        }

        return null;
      } catch (error) {
        console.error(`Failed to check receipt for ${txHash}:`, error);
        return null;
      }
    };

    const pollInterval = setInterval(async () => {
      for (const tx of pendingTxs) {
        const newStatus = await checkReceipt(tx.txHash);

        if (newStatus) {
          setHistory(prev =>
            prev.map(item =>
              item.id === tx.id ? { ...item, status: newStatus } : item
            )
          );
        }
      }

      // Stop polling if no more pending transactions
      const stillPending = history.filter(tx => tx.status === 'Pending');
      if (stillPending.length === 0) {
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [history]);

  const addEntry = useCallback((
    type: TxType,
    asset: string,
    amount: string,
    txHash: string
  ) => {
    const entry: TxHistoryEntry = {
      id: `${txHash}-${Date.now()}`,
      type,
      asset,
      amount,
      timestamp: Date.now(),
      txHash,
      status: 'Pending',
    };

    setHistory(prev => [entry, ...prev]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getBscScanUrl = useCallback((txHash: string) => {
    return `https://bscscan.com/tx/${txHash}`;
  }, []);

  return {
    history,
    addEntry,
    clearHistory,
    getBscScanUrl,
    isPolling,
  };
}
