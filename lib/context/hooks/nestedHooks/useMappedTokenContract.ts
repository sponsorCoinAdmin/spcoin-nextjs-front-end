'use client';

import { useMemo } from 'react';
import { useReadContracts, useChainId } from 'wagmi';
import { erc20Abi } from 'viem';
import { isAddress, Address } from 'viem';
import { TokenContract } from '@/lib/structure';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { createDebugLogger } from '@/lib/utils';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_MAPPER === 'true';
const debugLog = createDebugLogger('useMappedTokenContract', DEBUG_ENABLED, LOG_TIME);

export function useMappedTokenContract(tokenAddress?: Address): TokenContract | undefined | null {
  const nativeToken = useNativeToken();
  const isNativeToken = tokenAddress === NATIVE_TOKEN_ADDRESS;
  const chainId = useChainId();

  const isValidAddress = isAddress(tokenAddress || '');

  debugLog.log(`🔍 useMappedTokenContract() called with: ${tokenAddress}`);
  debugLog.log(`🧪 isNativeToken: ${isNativeToken}, isValidAddress: ${isValidAddress}`);

  const contracts = useMemo(() => {
    return isValidAddress && !isNativeToken
      ? [
          { address: tokenAddress!, abi: erc20Abi, functionName: 'symbol' },
          { address: tokenAddress!, abi: erc20Abi, functionName: 'name' },
          { address: tokenAddress!, abi: erc20Abi, functionName: 'decimals' },
          { address: tokenAddress!, abi: erc20Abi, functionName: 'totalSupply' },
        ]
      : [];
  }, [tokenAddress, isValidAddress, isNativeToken]);

  const { data: metaData, status: metaStatus } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  debugLog.log(`📦 Contract fetch status: ${metaStatus}, contracts: ${contracts.length}`);
  debugLog.log(`📊 metaData:`, metaData);

  const erc20Token = useMemo<Omit<TokenContract, 'balance'> | undefined>(() => {
    if (!isValidAddress || isNativeToken || !metaData || metaStatus !== 'success') {
      debugLog.log(`⏭️ Skipping ERC20 parse (invalid address or status)`);
      return undefined;
    }

    const [symbolRaw, nameRaw, decimalsRaw, totalSupplyRaw] = metaData.map((res) => res.result);

    if (!symbolRaw || !nameRaw || decimalsRaw == null) {
      debugLog.log('❗ Incomplete metadata:', { symbolRaw, nameRaw, decimalsRaw, totalSupplyRaw });
      return undefined;
    }

    const tokenInfo: Omit<TokenContract, 'balance'> = {
      chainId,
      address: tokenAddress!,
      symbol: symbolRaw as string,
      name: nameRaw as string,
      amount: 0n,
      decimals: Number(decimalsRaw),
      totalSupply: totalSupplyRaw as bigint,
    };

    debugLog.log('✅ ERC20 TokenContract metadata resolved:', tokenInfo);
    return tokenInfo;
  }, [metaData, metaStatus, tokenAddress, isValidAddress, isNativeToken, chainId]);

  return useMemo(() => {
    if (isNativeToken) {
      debugLog.log(`🎯 Returning native token`, stringifyBigInt(nativeToken));
      return nativeToken;
    }

    if (!erc20Token) {
      debugLog.log('⚠️ No token metadata available, returning null');
      return null;
    }

    const tokenWithBalance: TokenContract = {
      ...erc20Token,
      balance: 0n,
    };

    debugLog.log(`🎯 Returning ERC20 token`, stringifyBigInt(tokenWithBalance));
    return tokenWithBalance;
  }, [isNativeToken, nativeToken, erc20Token]);
}
