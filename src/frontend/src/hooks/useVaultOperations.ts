import { useState } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, encodeCall } from '@/lib/contracts';
import { parseUnits } from '@/lib/evm';

export function useVaultOperations() {
  const { account, isConnected, sendTransaction } = useWeb3();
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const depositToken = async (tokenAddress: string, amount: string): Promise<string> => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    setIsDepositing(true);
    try {
      const amountWei = parseUnits(amount, 18);
      
      // Approve token first
      const approveData = encodeCall('approve', [
        { type: 'address', value: VAULT_ADDRESS },
        { type: 'uint256', value: amountWei }
      ]);

      await sendTransaction(tokenAddress, approveData);

      // Wait a bit for approval to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then deposit
      const depositData = encodeCall('depositToken', [
        { type: 'address', value: tokenAddress },
        { type: 'uint256', value: amountWei }
      ]);
      
      const txHash = await sendTransaction(VAULT_ADDRESS, depositData);
      return txHash;
    } finally {
      setIsDepositing(false);
    }
  };

  const withdrawBNB = async (recipient: string, amount: string): Promise<string> => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    setIsWithdrawing(true);
    try {
      const amountWei = parseUnits(amount, 18);
      const data = encodeCall('withdrawBNB', [
        { type: 'address', value: recipient },
        { type: 'uint256', value: amountWei }
      ]);
      
      const txHash = await sendTransaction(VAULT_ADDRESS, data);
      return txHash;
    } finally {
      setIsWithdrawing(false);
    }
  };

  const withdrawToken = async (tokenAddress: string, recipient: string, amount: string): Promise<string> => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    setIsWithdrawing(true);
    try {
      const amountWei = parseUnits(amount, 18);
      const data = encodeCall('withdrawToken', [
        { type: 'address', value: tokenAddress },
        { type: 'address', value: recipient },
        { type: 'uint256', value: amountWei }
      ]);
      
      const txHash = await sendTransaction(VAULT_ADDRESS, data);
      return txHash;
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    depositToken,
    withdrawBNB,
    withdrawToken,
    isDepositing,
    isWithdrawing,
  };
}
