import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';
import { useWatchedTokens } from './useWatchedTokens';
import { VAULT_ADDRESS, encodeCall, decodeResult } from '@/lib/contracts';
import { formatUnits } from '@/lib/evm';

interface TokenBalance {
  address: string;
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
  error?: string;
}

export function useVaultBalances() {
  const { callContract } = useWeb3();
  const { tokens } = useWatchedTokens();
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [bnbBalanceRaw, setBnbBalanceRaw] = useState<bigint>(0n);
  const [bnbError, setBnbError] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch BNB balance
      try {
        const bnbData = encodeCall('bnbBalance', []);
        const bnbResult = await callContract(VAULT_ADDRESS, bnbData);
        const bnbRaw = decodeResult(bnbResult, 'uint256') as bigint;
        setBnbBalanceRaw(bnbRaw);
        setBnbBalance(formatUnits(bnbRaw, 18));
        setBnbError(null);
      } catch (err: any) {
        console.error('Error fetching BNB balance:', err);
        setBnbError(err.message || 'Failed to fetch BNB balance');
        setBnbBalance('0');
        setBnbBalanceRaw(0n);
      }

      // Fetch token balances using Promise.allSettled for resilient per-token error handling
      const balancePromises = tokens.map(async (tokenAddress): Promise<TokenBalance> => {
        try {
          // Fetch balance using ERC20 balanceOf
          const balanceData = encodeCall('balanceOf', [
            { type: 'address', value: VAULT_ADDRESS }
          ]);
          const balanceResult = await callContract(tokenAddress, balanceData);
          const balanceRaw = decodeResult(balanceResult, 'uint256') as bigint;

          // Fetch symbol
          const symbolData = '0x95d89b41'; // symbol()
          let symbol = 'TOKEN';
          try {
            const symbolResult = await callContract(tokenAddress, symbolData);
            // Decode string from bytes32 or dynamic string
            if (symbolResult && symbolResult !== '0x') {
              // Try to decode as string (skip first 64 chars for offset+length, then decode hex)
              const hex = symbolResult.slice(2);
              if (hex.length >= 128) {
                const strHex = hex.slice(128);
                symbol = Buffer.from(strHex, 'hex').toString('utf8').replace(/\0/g, '');
              } else if (hex.length > 0) {
                symbol = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
              }
            }
          } catch {
            // Use default symbol if fetch fails
          }

          // Fetch decimals
          const decimalsData = '0x313ce567'; // decimals()
          let decimals = 18;
          try {
            const decimalsResult = await callContract(tokenAddress, decimalsData);
            decimals = parseInt(decimalsResult, 16);
          } catch {
            // Use default decimals if fetch fails
          }

          const balance = formatUnits(balanceRaw, decimals);

          return {
            address: tokenAddress,
            balance,
            balanceRaw,
            symbol,
            decimals,
          };
        } catch (err: any) {
          console.error(`Error fetching balance for ${tokenAddress}:`, err);
          return {
            address: tokenAddress,
            balance: '0',
            balanceRaw: 0n,
            symbol: 'ERROR',
            decimals: 18,
            error: err.message || 'Failed to fetch token balance',
          };
        }
      });

      const results = await Promise.allSettled(balancePromises);
      const balances = results.map((result) =>
        result.status === 'fulfilled' ? result.value : {
          address: '',
          balance: '0',
          balanceRaw: 0n,
          symbol: 'ERROR',
          decimals: 18,
          error: 'Failed to fetch token balance',
        }
      );

      setTokenBalances(balances);
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError(err.message || 'Failed to fetch balances. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    try {
      await fetchBalances();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to refresh balances');
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [tokens.join(',')]);

  return {
    bnbBalance,
    bnbBalanceRaw,
    bnbError,
    tokenBalances,
    isLoading,
    error,
    refetch,
  };
}
