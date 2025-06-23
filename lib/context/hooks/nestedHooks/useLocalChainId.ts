'use client';

import { useNetwork } from '@/lib/context/hooks/nestedHooks/useNetwork';
import { useSwitchChain } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_LOCAL_CHAIN_ID === 'true';
const debugLog = createDebugLogger('useLocalChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read the local chainId from the ExchangeContext.
 * This is the authoritative value used throughout the app (instead of Wagmi's useChainId).
 */
export const useLocalChainId = (): number | undefined => {
  const { network } = useNetwork();
  const chainId = network?.chainId;

  if (DEBUG_ENABLED) {
    debugLog.log(`📦 useLocalChainId → ${chainId}`);
  }
  return chainId;
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
