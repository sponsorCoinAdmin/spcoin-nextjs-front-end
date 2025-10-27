import { useEffect, useState } from 'react';
import type { TokenContract as MappedTokenContract } from '@/lib/structure';
import { useAppChainId } from 'wagmi';

export function useNativeToken(): MappedTokenContract | undefined {
  const [token, setToken] = useState<MappedTokenContract>();
    const chainId = useAppChainId();
  

  useEffect(() => {
    if (!chainId) return;

    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/native-token/${chainId}`);
        if (res.ok) {
          const data = await res.json();
          setToken({
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // NATIVE_TOKEN_ADDRESS
            amount: 0n,
            balance: 0n,
            chainId,
            decimals: data.decimals,
            name: data.name,
            symbol: data.symbol,
            totalSupply: 0n,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch native token for chainId ${chainId}:`, err);
      }
    };

    fetchToken();
  }, [chainId]);

  return token;
}
