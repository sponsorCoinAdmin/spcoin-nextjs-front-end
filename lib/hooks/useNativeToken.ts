// File: @/lib/hooks/useNativeToken.ts

'use client';

import { useEffect, useState } from 'react';
import type { TokenContract as MappedTokenContract } from '@/lib/structure';
import { getJson } from '@/lib/rest/http';
import { useAppChainId } from '@/lib/context/hooks'; // ✅ your app's hook returns [chainId, setChainId]
import { createDebugLogger } from '@/lib/utils/debugLogger';

type NativeTokenMeta = {
  name: string;
  symbol: string;
  decimals: number;
};

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
        const url = `/api/native-token/${chainId}`;
        const data = await getJson<NativeTokenMeta>(url, {
          timeoutMs: 6000,
          retries: 1,
          accept: 'application/json',
          init: { cache: 'no-store' },
        });

        debugLog.log?.('[useNativeToken] ✅ Loaded native token metadata', {
          chainId,
          url,
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
        debugLog.error?.('[useNativeToken] ❌ Failed to load native token', {
          chainId,
          error: err?.message ?? String(err),
        });
      }
    })();
  }, [chainId]);

  return token;
}
