// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/network/utils';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

// 🔎 New: minimal probe to record the open intent (timestamp + stack) for SELL/BUY
import { markPanelOpen } from '@/lib/debug/panels/panelVisibilityProbe';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  /** The root container this dropdown belongs to (SELL_SELECT_PANEL or BUY_SELECT_PANEL) */
  containerType:
    | SP_COIN_DISPLAY.SELL_SELECT_PANEL
    | SP_COIN_DISPLAY.BUY_SELECT_PANEL;
}

function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook  = useBuyTokenContract();

  // ✅ Use the *root* panel to decide which token state to read
  const isSellRoot = containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL;
  const [tokenContract] = isSellRoot ? sellHook : buyHook;

  // Transition helpers
  const { openSellList, openBuyList } = usePanelTransitions();

  // Panel visibility (for debug only)
  const { isVisible } = usePanelTree();

  // Resolve logo with safe fallback
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

  const openTokenSelectPanel = useCallback((e?: React.SyntheticEvent) => {
    // Prevent outside-click listeners from seeing this click (avoids open→immediate close flashes)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    clearFSMTraceFromMemory();

    const side: 'SELL' | 'BUY' = isSellRoot ? 'SELL' : 'BUY';
    const targetPanel =
      isSellRoot ? SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL : SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;

    const startSellVisible = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const startBuyVisible  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

    const sourceId =
      (e?.target as HTMLElement | null)?.id ||
      (e?.currentTarget as HTMLElement | null)?.id ||
      'unknown';

    // 🔎 record intent with timestamp + stack (the probe decides how to persist)
    try {
      markPanelOpen(side);
    } catch {
      // probe is optional; ignore if absent
    }

    debugLog.log(
      `📂 Intent: open ${side}_LIST_SELECT_PANEL (source=${sourceId}) ` +
      `(before sell=${startSellVisible}, buy=${startBuyVisible})`
    );

    // Defer to next task/microtask to avoid competing global “mousedown” closers
    queueMicrotask(() => {
      isSellRoot ? openSellList() : openBuyList();

      // Verify result next tick; if it closes immediately, we’ll see it here
      setTimeout(() => {
        const endSellVisible = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
        const endBuyVisible  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

        const opened =
          (targetPanel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL && endSellVisible) ||
          (targetPanel === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL && endBuyVisible);

        if (opened) {
          debugLog.log(
            `✅ Opened ${side}_LIST_SELECT_PANEL (sell=${endSellVisible}, buy=${endBuyVisible})`
          );
        } else {
          // This is the critical case you’re seeing in prod (flash open→closed)
          debugLog.warn(
            `❌ Panel not visible after open attempt → likely closed by another handler ` +
            `(sell=${endSellVisible}, buy=${endBuyVisible})`
          );
        }
      }, 0);
    });
  }, [isSellRoot, openSellList, openBuyList, isVisible]);

  // Helper to prevent bubbling to any document/parent mousedown listeners that might close overlays
  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div id="TokenSelectDropDown" className={styles.assetSelect}>
      {tokenContract ? (
        <>
          <img
            id="TokenSelectDropDownImage.png"
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            alt={`${tokenContract.name ?? tokenContract.symbol ?? 'token'} logo`}
            src={logoURL}
            loading="lazy"
            decoding="async"
            onMouseDown={stopMouseDown}
            onClick={openTokenSelectPanel}
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
        onMouseDown={stopMouseDown}
        onClick={openTokenSelectPanel}
      />
    </div>
  );
}

export default TokenSelectDropDown;
