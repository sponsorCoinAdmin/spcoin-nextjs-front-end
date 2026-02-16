// File: @/lib/utils/network/hooks/useAppChainId.ts
'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_APP_CHAIN_ID === 'true';

const debugLog = createDebugLogger('useAppChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * App-first chain id (no wallet mirroring):
 * - Reads from exchangeContext.network.appChainId
 * - Setter delegates to `setAppChainId` from ExchangeContext
 */
export function useAppChainId(): [number, (nextId: number) => void] {
  const { exchangeContext, setAppChainId } = useExchangeContext();

  const appChainId = exchangeContext?.network?.appChainId ?? 0;

  /** Thin wrapper around ExchangeProvider setter with extra debug logging */
  const wrappedSetAppChainId = (nextId: number) => {
    debugLog.log(`🛠️ setAppChainId → ${nextId}`);
    setAppChainId(nextId); // ExchangeProvider logs again when state changes
  };

  return [appChainId, wrappedSetAppChainId];
}
