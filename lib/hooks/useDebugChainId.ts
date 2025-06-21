// File: lib/hooks/useDebugChainId.ts

'use client';

import { useChainId } from 'wagmi';
import { useEffect } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_DEBUG_CHAIN_ID === 'true';
const debugLog = createDebugLogger('useDebugChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * Wraps wagmi’s useChainId with source-based logging for render tracking.
 */
export function useDebugChainId(source: string): number {
  const chainId = useChainId();

  useEffect(() => {
    debugLog.log(`🔗 useDebugChainId('${source}') ➝ chainId=${chainId}`);
  }, [chainId, source]);

  return chainId;
}
