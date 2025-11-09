// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useMemo, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/network/utils';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType:
    | SP_COIN_DISPLAY.SELL_SELECT_PANEL
    | SP_COIN_DISPLAY.BUY_SELECT_PANEL;
}

function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook  = useBuyTokenContract();

  const isSellRoot = containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL;
  const [tokenContract] = isSellRoot ? sellHook : buyHook;

  const { openSellList, openBuyList } = usePanelTransitions();

  // --- open guard to avoid open→close races
  const openingRef = useRef<number>(0);
  const OPEN_GUARD_MS = 160;

  const logoURL = useMemo(() => {
    const raw = tokenContract?.logoURL?.trim();
    if (raw && raw.length > 0) {
      return raw.startsWith('http://') ||
             raw.startsWith('https://') ||
             raw.startsWith('/')
        ? raw
        : `/${raw.replace(/^\/+/, '')}`;
    }
    return defaultMissingImage;
  }, [tokenContract?.logoURL]);

  const handleMissingLogoURL = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget as HTMLImageElement;
      img.onerror = null;
      img.src = defaultMissingImage;
      if (tokenContract?.symbol && tokenContract?.address) {
        debugLog.log(`⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`);
      } else {
        debugLog.log(`⚠️ Missing logo (no tokenContract info available)`);
      }
    },
    [tokenContract]
  );

  const openTokenSelectPanel = useCallback(
    (e?: React.SyntheticEvent | MouseEvent) => {
      // Stop this event from reaching any backdrop/document close handlers
      e?.stopPropagation();
      // Prevent focus changes from causing blur-close handlers
      if ('preventDefault' in (e ?? {})) (e as any).preventDefault?.();

      // If we just opened, ignore re-entrancy
      const now = Date.now();
      if (now - openingRef.current < OPEN_GUARD_MS) return;
      openingRef.current = now;

      clearFSMTraceFromMemory();

      const target = isSellRoot ? 'SELL' : 'BUY';
      debugLog.log(`📂 Opening TokenListSelectPanel → ${target}_LIST_SELECT_PANEL`);

      // Use mouse-down timing (already inside mousedown if caller uses it)
      // Defer actual open to next frame to fully escape current event stack
      requestAnimationFrame(() => {
        isSellRoot ? openSellList() : openBuyList();
      });
    },
    [isSellRoot, openSellList, openBuyList]
  );

  return (
    <div
      id="TokenSelectDropDown"
      className={styles.assetSelect}
      // prevent parent handlers from seeing trigger mousedown/click
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {tokenContract ? (
        <>
          <img
            id="TokenSelectDropDownImage.png"
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            alt={`${tokenContract.name ?? tokenContract.symbol ?? 'token'} logo`}
            src={logoURL}
            loading="lazy"
            decoding="async"
            // OPEN ON MOUSEDOWN to beat blur/click-close listeners
            onMouseDown={(e) => openTokenSelectPanel(e)}
            onError={handleMissingLogoURL}
          />
          {tokenContract.symbol ?? 'Select Token'}
        </>
      ) : (
        <>Select Token:</>
      )}

      <ChevronDown
        id="ChevronDown"
        size={18}
        className="ml-2 cursor-pointer"
        onMouseDown={(e) => openTokenSelectPanel(e)}
      />
    </div>
  );
}

export default TokenSelectDropDown;
