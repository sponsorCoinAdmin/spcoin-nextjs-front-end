'use client';

import { isAddress } from 'viem';
import { useBalance, useAccount, useChainId } from 'wagmi';
import { useMemo, useRef } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useTokenBalance', DEBUG_ENABLED, LOG_TIME);

export function useTokenBalance(tokenAddress: string | undefined) {
  const chainId = useChainId();
  const { address: accountAddress } = useAccount();

  const isValidToken = isAddress(tokenAddress || '');
  const isValidAccount = isAddress(accountAddress || '');

  const params = useMemo(() => ({
    address: isValidAccount ? (accountAddress as `0x${string}`) : undefined,
    token: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
    chainId,
    watch: false,
  }), [tokenAddress, accountAddress, chainId, isValidToken, isValidAccount]);

  // 🔁 Debug log only if inputs change
  const lastHashRef = useRef('');
  const paramHash = JSON.stringify(params);

  if (paramHash !== lastHashRef.current) {
    lastHashRef.current = paramHash;
    debugLog.log('🔍 useTokenBalance input (changed):', params);
  }

  return useBalance(params);
}
