// File: lib/hooks/validationStateHooks/useTokenBalance.ts

'use client';

import { isAddress } from 'viem';
import { useBalance } from 'wagmi';
import { useMemo, useRef } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useInputValidationState', DEBUG_ENABLED, LOG_TIME);

export function useTokenBalance(
  tokenAddress: string | undefined,
  chainId: number | undefined,
  accountAddress: string | undefined
) {
  const isValidToken = isAddress(tokenAddress || '');
  const isValidAccount = isAddress(accountAddress || '');

  const params = useMemo(() => {
    return {
      address: isValidAccount ? (accountAddress as `0x${string}`) : undefined,
      token: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
      chainId,
      query: {
        enabled: isValidAccount && isValidToken,
      },
    };
  }, [tokenAddress, chainId, accountAddress, isValidAccount, isValidToken]);

  // 🔁 Only log when params change
  const lastHashRef = useRef('');
  const paramHash = JSON.stringify(params);

  if (paramHash !== lastHashRef.current) {
    lastHashRef.current = paramHash;
    debugLog.log('🔍 useTokenBalance input (changed):', params);
  }

  return useBalance(params);
}
