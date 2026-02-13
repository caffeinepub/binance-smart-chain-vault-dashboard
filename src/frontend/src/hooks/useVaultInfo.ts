import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, encodeCall, decodeResult } from '@/lib/contracts';

export function useVaultInfo() {
  const { isConnected, callContract } = useWeb3();
  const [owner, setOwner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOwner = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const data = encodeCall('owner', []);
      const result = await callContract(VAULT_ADDRESS, data);
      const ownerAddress = decodeResult(result, 'address') as string;
      setOwner(ownerAddress);
    } catch (error) {
      console.error('Error fetching owner:', error);
      setOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchOwner();
    }
  }, [isConnected]);

  return {
    owner,
    isLoading,
    refetch: fetchOwner,
  };
}
