// File: @/lib/context/AssetSelectPanels/hooks/usePanelBag.ts
'use client';

import type { Dispatch, SetStateAction} from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SP_COIN_DISPLAY } from '@/lib/structure';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';
const debugLog = createDebugLogger('usePanelBag', DEBUG_ENABLED, LOG_TIME);

export function usePanelBag(
  initialPanelBag: AssetSelectBag | undefined,
  containerType: SP_COIN_DISPLAY,
) {
  const [panelBag, setPanelBagState] = useState<AssetSelectBag>(
    initialPanelBag ?? ({ type: containerType } as AssetSelectBag),
  );

  const prevRef = useRef<AssetSelectBag | undefined>();
  useEffect(() => {
    if (prevRef.current !== panelBag) {
      debugLog.log?.(`🎒 panelBag: ${JSON.stringify(prevRef.current)} → ${JSON.stringify(panelBag)}`);
      prevRef.current = panelBag;
    }
  }, [panelBag]);

  const setPanelBag: Dispatch<SetStateAction<AssetSelectBag>> = useCallback((update) => {
    setPanelBagState((prev) => {
      const next = typeof update === 'function' ? (update as any)(prev) : update;
      debugLog.log?.(`🎒 setPanelBag(prev→next): ${JSON.stringify(prev)} → ${JSON.stringify(next)}`);
      return next;
    });
  }, []);

  return { panelBag, setPanelBag };
}
