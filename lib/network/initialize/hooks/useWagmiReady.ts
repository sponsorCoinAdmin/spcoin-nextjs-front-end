// File: @/lib/network/hooks/useWagmiReady.ts
'use client';

import { useAccount } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_WAGMI_READY === 'true';

const debugLog = createDebugLogger('useWagmiReady', DEBUG_ENABLED, LOG_TIME);

/**
 * useWagmiReady
 *
 * Tiny gate hook that answers:
 *   "Has wagmi finished its initial handshake so the app can safely boot?"
 *
 * Semantics:
 *   - status === 'connecting'  → NOT ready
 *   - status === 'reconnecting' → NOT ready
 *   - status === 'connected' or 'disconnected' → READY
 *
 * This does *not* say whether a wallet is connected; it only says
 * "wagmi has settled on a state".
 */
export function useWagmiReady(): boolean {
  const { status, isConnected } = useAccount();

  const ready = status !== 'connecting' && status !== 'reconnecting';

  debugLog.log?.('snapshot', {
    status,
    isConnected,
    wagmiReady: ready,
  });

  return ready;
}
