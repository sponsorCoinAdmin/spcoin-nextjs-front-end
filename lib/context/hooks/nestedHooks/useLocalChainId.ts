// File: lib/context/hooks/nestedHooks/useLocalChainId.ts

'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { useSwitchChain } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_LOCAL_CHAIN_ID === 'true';
const debugLog = createDebugLogger('useLocalChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read the local chainId from the ExchangeContext.
 * Returns `exchangeContext.network.chainId`, or defaults to `1` if undefined.
 */
export const useLocalChainId = (): number => {
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext.network?.chainId;

  const returnValue = typeof chainId === 'number' && chainId > 0 ? chainId : 1;

  if (DEBUG_ENABLED) {
    debugLog.log(`📦 useLocalChainId triggered`);
    debugLog.log(`🌐 exchangeContext.network =`, exchangeContext.network);
    debugLog.log(`📦 useLocalChainId → ${returnValue}`);
  }

  return returnValue;
};

/**
 * Hook to request a wallet chain switch.
 * This triggers useLocalChainId update, which is then picked up by useNetwork().
 */
export const useSetLocalChainId = (): ((newChainId: number) => Promise<void>) => {
  const { switchChain } = useSwitchChain();

  return async (newChainId: number) => {
    debugLog.log(`🔁 Requesting wallet switch to chainId=${newChainId}`);

    try {
      switchChain({ chainId: newChainId });
      debugLog.log(`✅ switchChain success → chainId=${newChainId}`);
    } catch (err: unknown) {
      debugLog.error(`❌ switchChain failed: ${(err as Error)?.message || err}`);
    }
  };
};
