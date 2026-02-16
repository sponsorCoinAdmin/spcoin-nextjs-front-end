// File: @/lib/utils/network/hooks/useConnected.ts
'use client';

import { useCallback } from 'react';
import { useNetwork } from '@/lib/context/hooks/ExchangeContext/nested/useNetwork';

/**
 * Hook to read and update `exchangeContext.network.connected`.
 *
 * Returns:
 *   [connected, setConnected]
 *
 * - `connected` is the current boolean flag from exchangeContext.network.connected
 * - `setConnected` accepts either:
 *      • a boolean, or
 *      • an updater function: (prev: boolean) => boolean
 */
export function useConnected(): [
  boolean,
  (next: boolean | ((prev: boolean) => boolean)) => void,
] {
  const [network, setNetwork] = useNetwork();
  const connected = !!network.connected;

  const setConnected = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setNetwork((prev) => {
        const current = !!prev.connected;
        const updated =
          typeof next === 'function'
            ? (next as (p: boolean) => boolean)(current)
            : next;

        return {
          ...prev,
          connected: updated,
        };
      });
    },
    [setNetwork],
  );

  return [connected, setConnected];
}
