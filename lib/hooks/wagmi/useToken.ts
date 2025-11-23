// File: @/lib/hooks/wagmi/useToken.ts
'use client';

import { useEffect, useState } from 'react';
import type { Address} from 'viem';
import { isAddress } from 'viem';
import { usePublicClient, useAccount } from 'wagmi';
import type { TokenContract } from '@/lib/structure/types';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { useAppChainId } from '@/lib/context/hooks';

export function useToken(tokenAddress?: Address): TokenContract | undefined {
  const [token, setToken] = useState<TokenContract | undefined>();
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  // ✅ Only take the chainId value from the tuple
  const [chainId] = useAppChainId();

  useEffect(() => {
    if (!tokenAddress || !isAddress(tokenAddress) || !publicClient) {
      setToken(undefined);
      return;
    }

    const fetchToken = async () => {
      try {
        const result = await resolveContract(tokenAddress, chainId, publicClient, userAddress);
        setToken(result);
      } catch (err) {
        console.error('❌ useToken failed to resolve contract:', err);
        setToken(undefined);
      }
    };

    fetchToken();
  }, [tokenAddress, chainId, publicClient, userAddress]);

  return token;
}
