// File: lib/context/hooks/nestedHooks/useMappedTokenContract.ts

'use client';

import { useMemo } from 'react';
import { useReadContracts, useChainId } from 'wagmi';
import { erc20Abi } from 'viem';
import { isAddress, Address } from 'viem';
import { TokenContract } from '@/lib/structure';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_MAPPER === 'true';
const debugLog = createDebugLogger('useMappedTokenContract', DEBUG_ENABLED, LOG_TIME);

function useErc20TokenContract(tokenAddress?: Address): Omit<TokenContract, 'balance'> | undefined {
  const chainId = useChainId();
  const enabled = !!tokenAddress && isAddress(tokenAddress);

  if (!enabled) {
    debugLog.log(`🔍 useErc20TokenContract() → skipped: tokenAddress=${tokenAddress}, enabled=false`);
    return undefined;
  }

  const { data: metaData, status: metaStatus } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
    ],
    query: { enabled },
  });

  debugLog.log(`🔍 useErc20TokenContract() → enabled=${enabled}, tokenAddress=${tokenAddress}, chainId=${chainId}`);
  debugLog.log(`📦 Contract fetch status: ${metaStatus}, metaData:`, metaData);

  if (metaStatus !== 'success' || !metaData) {
    debugLog.log('❌ Metadata fetch failed or not ready');
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
}

export function useMappedTokenContract(tokenAddress?: Address): TokenContract | undefined | null {
  const nativeToken = useNativeToken();
  const isNativeToken = tokenAddress === NATIVE_TOKEN_ADDRESS;

  const stableTokenAddress = useMemo(() => {
    const valid = isAddress(tokenAddress || '');
    if (!valid) {
      debugLog.log(`⛔ useMappedTokenContract() short-circuit → invalid address: ${tokenAddress}`);
      return undefined;
    }
    return tokenAddress;
  }, [tokenAddress]);

  // 🛑 Exit early — avoids useErc20TokenContract when tokenAddress is invalid
  if (!stableTokenAddress && !isNativeToken) {
    debugLog.log(`🚫 useMappedTokenContract() returning null early — address is invalid`);
    return null;
  }

  const token = useErc20TokenContract(stableTokenAddress);

  debugLog.log(`🧭 useMappedTokenContract() → isNative=${isNativeToken}, tokenAddress=${tokenAddress}`);

  return useMemo(() => {
    if (!token) {
      debugLog.log('⚠️ No token metadata found, returning null');
      return null;
    }

    const baseToken: TokenContract = {
      ...token,
      balance: 0n,
    };

    const mapped = isNativeToken ? nativeToken : baseToken;
    debugLog.log(`🎯 Returning mapped token:`, stringifyBigInt(mapped));
    return mapped;
  }, [
    token?.address,
    token?.symbol,
    token?.name,
    token?.decimals,
    token?.totalSupply,
    token?.chainId,
    isNativeToken,
    nativeToken,
  ]);
}
