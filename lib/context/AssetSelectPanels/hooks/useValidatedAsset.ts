// File: @/lib/context/AssetSelectPanels/hooks/useValidatedAsset.ts
'use client';

import { useCallback, useState } from 'react';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';
const debugLog = createDebugLogger('useValidatedAsset', DEBUG_ENABLED, LOG_TIME);

function sameAsset(a?: TokenContract | WalletAccount, b?: TokenContract | WalletAccount) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  // WalletAccount has `address`; TokenContract has `address` (Address type)
  return (a as any).address === (b as any).address && (a as any).symbol === (b as any).symbol;
}

export function useValidatedAsset<T extends TokenContract | WalletAccount>() {
  const [validatedAsset, setValidatedAssetRaw] = useState<T | undefined>(undefined);

  const setValidatedAsset = useCallback((next?: T) => {
    if (sameAsset(validatedAsset, next)) return;
    debugLog.log?.(
      `✅ setValidatedAsset: ${validatedAsset ? (validatedAsset as any).symbol : '—'} → ${
        next ? (next as any).symbol : '—'
      }`,
    );
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  const resetValidatedAsset = useCallback(() => setValidatedAssetRaw(undefined), []);

  // Narrow TokenContract only (legacy API)
  const validatedAssetNarrow = validatedAsset as unknown as TokenContract | undefined;
  const setValidatedAssetNarrow = useCallback(
    (t?: TokenContract) => setValidatedAsset(t as unknown as T),
    [setValidatedAsset],
  );

  return {
    validatedAsset,
    setValidatedAsset,
    resetValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  };
}
