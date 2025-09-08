// File: lib/context/AssetSelectPanels/hooks/useProviderCallbacks.ts
'use client';

import { useCallback } from 'react';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { useLatestRef } from '@/lib/hooks/useLatestRef';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';
const debugLog = createDebugLogger('useProviderCallbacks', DEBUG_ENABLED, LOG_TIME);

type ParentCallbacks = {
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
};

export function useProviderCallbacks(parent: ParentCallbacks, instanceId: string) {
  const parentRef = useLatestRef(parent);

  const fireSetTradingToken = useCallback((asset: TokenContract | WalletAccount) => {
    try {
      debugLog.log?.(
        `[${instanceId}] 🚀 setTradingTokenCallback(asset=${
          asset && (asset as any).address ? (asset as any).address : 'wallet'
        })`,
      );
      parentRef.current.setTradingTokenCallback(asset);
    } catch (e) {
      debugLog.error?.(`[${instanceId}] setTradingTokenCallback failed`, e);
    }
  }, [instanceId, parentRef]);

  const fireClosePanel = useCallback((fromUser: boolean) => {
    try {
      debugLog.log?.(`[${instanceId}] 🚪 closePanelCallback(fromUser=${fromUser})`);
      parentRef.current.closePanelCallback(fromUser);
    } catch (e) {
      debugLog.error?.(`[${instanceId}] closePanelCallback failed`, e);
    }
  }, [instanceId, parentRef]);

  return { fireSetTradingToken, fireClosePanel };
}
