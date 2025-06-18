'use client';

import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { TokenContract } from '@/lib/structure/types';
import { useName } from './ERC20/useName';
import { useDecimals } from './ERC20/useDecimals';
import { useTotalSupply } from './ERC20/useTotalSupply';
import { useBalanceOf } from './ERC20/useBalanceOf';
import { useAccount, useChainId } from 'wagmi';

export function useToken(tokenAddress?: Address): TokenContract | undefined {
  const [token, setToken] = useState<TokenContract | undefined>();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const { data: name } = useName(tokenAddress!);
  const { data: decimals } = useDecimals(tokenAddress!);
  const { data: totalSupply } = useTotalSupply(tokenAddress!);
  const { data: balanceData } = useBalanceOf({ address: userAddress!, token: tokenAddress });

  useEffect(() => {
    if (!tokenAddress || !isAddress(tokenAddress)) {
      setToken(undefined);
      return;
    }

    setToken({
      address: tokenAddress,
      name,
      decimals,
      totalSupply,
      balance: balanceData?.value ?? 0n,
      chainId,
    });
  }, [tokenAddress, name, decimals, totalSupply, balanceData?.value, chainId]);

  return token;
}
