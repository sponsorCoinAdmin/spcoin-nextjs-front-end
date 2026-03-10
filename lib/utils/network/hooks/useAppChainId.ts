// File: lib/utils/network/hooks/useAppChainId.ts
'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  isMappedChainId,
  toMappedChainId,
  toOriginalChainId,
} from '@/lib/utils/network/chainIdMap';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_APP_CHAIN_ID === 'true';

const debugLog = createDebugLogger('useAppChainId', DEBUG_ENABLED, LOG_TIME);

export type UseAppChainIdResult = [number, (nextId: number) => void] & {
  appChainId: number;
  mappedAppChainId: number;
  isMapped: boolean;
  toMappedChainId: (id?: number) => number;
  toOriginalChainId: (id?: number) => number;
};

/**
 * App-first chain id + mapped chain id:
 * - tuple remains backward compatible: [appChainId, setAppChainId]
 * - adds mapped helpers/properties for token asset chain routing
 */
export function useAppChainId(): UseAppChainIdResult {
  const { exchangeContext, setAppChainId } = useExchangeContext();

  const appChainId = exchangeContext?.network?.appChainId ?? 0;
  const mappedAppChainId = toMappedChainId(appChainId);
  const isMapped = isMappedChainId(appChainId);

  const wrappedSetAppChainId = (nextId: number) => {
    debugLog.log(`setAppChainId -> ${nextId}`);
    setAppChainId(nextId);
  };

  const resolveMapped = (id?: number) =>
    toMappedChainId(typeof id === 'number' ? id : appChainId);
  // Default should reflect current app chain as-is; only reverse-map explicit inputs.
  const resolveOriginal = (id?: number) =>
    typeof id === 'number' ? toOriginalChainId(id) : appChainId;

  const tuple = [appChainId, wrappedSetAppChainId] as unknown as UseAppChainIdResult;
  tuple.appChainId = appChainId;
  tuple.mappedAppChainId = mappedAppChainId;
  tuple.isMapped = isMapped;
  tuple.toMappedChainId = resolveMapped;
  tuple.toOriginalChainId = resolveOriginal;

  return tuple;
}
