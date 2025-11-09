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
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

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

  // VISIBILITY PROBES (debug-friendly, cheap)
  const sellListVisible = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyListVisible  = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

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
      const img = event.currentTarget;
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

  // Small helper to stop bubbling; useful if a global click-to-close is listening
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const openTokenSelectPanel = useCallback((e?: React.SyntheticEvent) => {
    // Guard against global click handlers closing immediately
    e?.stopPropagation();

    clearFSMTraceFromMemory();

    const target = isSellRoot ? 'SELL' : 'BUY';
    DEBUG_ENABLED && debugLog.log(
      `🟩 openTokenSelectPanel click → target=${target}; before: {sellVisible:${sellListVisible}, buyVisible:${buyListVisible}}`
    );

    // Use named transition (radio behavior handled internally)
    isSellRoot ? openSellList() : openBuyList();

    // Defer a tick to see if something instantly closes it
    if (DEBUG_ENABLED) {
      setTimeout(() => {
        debugLog.log(
          `🟨 after open → {sellVisible:${document ? sellListVisible : 'n/a'}, buyVisible:${document ? buyListVisible : 'n/a'}} (note: values are hooks, so add console probes below if needed)`
        );
      }, 0);
      // Extra microtask to catch truly immediate flips
      Promise.resolve().then(() => {
        debugLog.log('🟡 microtask after open (if it closed immediately, a click-outside/toggle likely fired)');
      });
    }
  }, [DEBUG_ENABLED, buyListVisible, isSellRoot, openBuyList, openSellList, sellListVisible]);

  return (
    <div
      id="TokenSelectDropDown"
      className={styles.assetSelect}
      onMouseDown={stop}   // reduce risk of mousedown-up combos triggering global handlers
      onClick={stop}
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
            onMouseDown={stop}
            onClick={(e) => openTokenSelectPanel(e)}
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
        onMouseDown={stop}
        onClick={(e) => openTokenSelectPanel(e)}
      />
    </div>
  );
}

export default TokenSelectDropDown;
