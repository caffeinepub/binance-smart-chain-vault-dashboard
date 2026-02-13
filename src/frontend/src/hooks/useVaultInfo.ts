import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';
import { VAULT_ADDRESS, encodeCall, decodeResult } from '@/lib/contracts';

export function useVaultInfo() {
  const { callContract } = useWeb3();
  const [owner, setOwner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOwner = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = encodeCall('owner', []);
      const result = await callContract(VAULT_ADDRESS, data);
      const ownerAddress = decodeResult(result, 'address') as string;
      setOwner(ownerAddress);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to fetch owner';
      console.error('Error fetching owner:', error);
      setError(errorMsg);
      setOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwner();
  }, []);

  return {
    owner,
    isLoading,
    error,
    refetch: fetchOwner,
  };
}
