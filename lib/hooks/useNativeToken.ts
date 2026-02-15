// File: @/lib/hooks/useNativeToken.ts
'use client';

import { useEffect, useState } from 'react';
import type { TokenContract as MappedTokenContract } from '@/lib/structure';
import { getNativeTokenMeta } from '@/lib/api';
import { useAppChainId } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const NATIVE_TOKEN_ADDRESS =
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNativeToken', DEBUG_ENABLED, LOG_TIME);

export function useNativeToken(): MappedTokenContract | undefined {
  const [token, setToken] = useState<MappedTokenContract>();
  const [chainId] = useAppChainId();

  useEffect(() => {
    if (!chainId) return;

    (async () => {
      try {
        const data = await getNativeTokenMeta(chainId, { timeoutMs: 6000 });

        debugLog.log?.('[useNativeToken] loaded native token metadata', {
          chainId,
          name: data.name,
          symbol: data.symbol,
          decimals: data.decimals,
        });

        setToken({
          address: NATIVE_TOKEN_ADDRESS,
          amount: 0n,
          balance: 0n,
          chainId,
          decimals: data.decimals,
          name: data.name,
          symbol: data.symbol,
          totalSupply: 0n,
        });
      } catch (err: any) {
        debugLog.error?.('[useNativeToken] failed to load native token', {
          chainId,
          error: err?.message ?? String(err),
        });
      }
    })();
  }, [chainId]);

  return token;
}
