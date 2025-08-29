// File: lib/hooks/wagmi/useToken.ts

'use client';

import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { usePublicClient, useAccount, useAppChainId } from 'wagmi';
import { TokenContract } from '@/lib/structure/types';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';

export function useToken(tokenAddress?: Address): TokenContract | undefined {
  const [token, setToken] = useState<TokenContract | undefined>();
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
  const chainId = useAppChainId();

  useEffect(() => {
    if (!tokenAddress || !isAddress(tokenAddress) || !publicClient) {
      setToken(undefined);
      return;
    }

    const fetch = async () => {
      try {
        const result = await resolveContract(tokenAddress, chainId, publicClient, userAddress);
        setToken(result);
      } catch (err) {
        console.error('❌ useToken failed to resolve contract:', err);
        setToken(undefined);
      }
    };

    fetch();
  }, [tokenAddress, chainId, publicClient, userAddress]);

  return token;
}
