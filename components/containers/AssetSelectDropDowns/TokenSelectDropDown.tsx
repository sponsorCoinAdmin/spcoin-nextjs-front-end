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

// 🔎 Minimal probe to record the open intent (timestamp + stack) for SELL/BUY
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

  // 🛡️ Stop the gesture from reaching any global "outside click" closers.
  // We guard multiple phases/types because prod toolchains / browser differ:
  const stopPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);
  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const stopClickCapture = useCallback((e: React.MouseEvent) => {
    // Capture-phase: prevent bubbling "click" from arriving at document listeners.
    e.stopPropagation();
  }, []);

  const openTokenSelectPanel = useCallback((e?: React.SyntheticEvent) => {
    // Prevent outside-click listeners from seeing THIS click
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

    // 🔎 record intent with timestamp + stack (no-op unless debug flag on)
    try {
      markPanelOpen(side);
    } catch {
      /* probe optional */
    }

    debugLog.log(
      `📂 Intent: open ${side}_LIST_SELECT_PANEL (source=${sourceId}) ` +
      `(before sell=${startSellVisible}, buy=${startBuyVisible})`
    );

    // Defer to let any synchronous outside-click handlers finish first.
    queueMicrotask(() => {
      isSellRoot ? openSellList() : openBuyList();

      // Verify result on the next frame: gives state/reducer time to apply.
      // This helps detect "flash open→closed" and proves *who* won the race.
      requestAnimationFrame(() => {
        const endSellV1 = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
        const endBuyV1  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

        const openedNow =
          (targetPanel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL && endSellV1) ||
          (targetPanel === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL && endBuyV1);

        if (openedNow) {
          debugLog.log(`✅ Opened ${side}_LIST_SELECT_PANEL (sell=${endSellV1}, buy=${endBuyV1})`);
        } else {
          debugLog.warn(
            `❌ Panel not visible after open attempt → likely closed by another handler ` +
            `(sell=${endSellV1}, buy=${endBuyV1})`
          );
        }
      });
    });
  }, [isSellRoot, openSellList, openBuyList, isVisible]);

  return (
    <div
      id="TokenSelectDropDown"
      className={styles.assetSelect}
      // Capture-phase guard on the wrapper too, in case clicks miss the child handlers.
      onClickCapture={stopClickCapture}
      onPointerDown={stopPointerDown}
      onMouseDown={stopMouseDown}
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
            // Guard all relevant phases on the clickable icon
            onPointerDown={stopPointerDown}
            onMouseDown={stopMouseDown}
            onClickCapture={stopClickCapture}
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
        // Guard the chevron as well
        onPointerDown={stopPointerDown}
        onMouseDown={stopMouseDown}
        onClickCapture={stopClickCapture}
        onClick={openTokenSelectPanel}
      />
    </div>
  );
}

export default TokenSelectDropDown;
