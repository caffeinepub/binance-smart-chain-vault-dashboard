import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';
import { useWatchedTokens } from './useWatchedTokens';
import { VAULT_ADDRESS, encodeCall, decodeResult } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';

interface TokenBalance {
  address: string;
  balance: string;
  symbol: string;
  decimals: number;
}

export function useVaultBalances() {
  const { isConnected, callContract } = useWeb3();
  const { tokens: watchedTokens } = useWatchedTokens();
  const [bnbBalance, setBnbBalance] = useState('0.0');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBNBBalance = async () => {
    if (!isConnected) return;

    try {
      const data = encodeCall('bnbBalance', []);
      const result = await callContract(VAULT_ADDRESS, data);
      const balanceBigInt = decodeResult(result, 'uint256') as bigint;
      const formatted = formatUnits(balanceBigInt, 18, 4);
      setBnbBalance(formatted);
    } catch (error) {
      console.error('Error fetching BNB balance:', error);
    }
  };

  const fetchTokenBalance = async (tokenAddress: string): Promise<TokenBalance | null> => {
    if (!isConnected) return null;

    try {
      const data = encodeCall('tokenBalance', [
        { type: 'address', value: tokenAddress }
      ]);
      const result = await callContract(VAULT_ADDRESS, data);
      const balanceBigInt = decodeResult(result, 'uint256') as bigint;
      const formatted = formatUnits(balanceBigInt, 18, 4);

      return {
        address: tokenAddress,
        balance: formatted,
        symbol: 'TOKEN',
        decimals: 18,
      };
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }
  };

  const fetchAllBalances = async () => {
    setIsLoading(true);
    try {
      await fetchBNBBalance();

      const tokenBalancePromises = watchedTokens.map(fetchTokenBalance);
      const results = await Promise.all(tokenBalancePromises);
      const validBalances = results.filter((b): b is TokenBalance => b !== null);
      setTokenBalances(validBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchAllBalances();
  };

  useEffect(() => {
    if (isConnected) {
      fetchAllBalances();
    }
  }, [isConnected, watchedTokens.length]);

  return {
    bnbBalance,
    tokenBalances,
    isLoading,
    refetch,
  };
}
