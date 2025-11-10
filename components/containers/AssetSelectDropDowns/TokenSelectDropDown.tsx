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
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType: SP_COIN_DISPLAY.SELL_SELECT_PANEL | SP_COIN_DISPLAY.BUY_SELECT_PANEL;
}

export default function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook  = useBuyTokenContract();

  const isSellRoot = containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL;
  const [tokenContract] = isSellRoot ? sellHook : buyHook;

  // 🔧 Direct panel control (no usePanelTransitions)
  const { openPanel, isVisible } = usePanelTree();

  // Guards to catch flash-close / double clicks
  const lastOpenAtRef = useRef<number | null>(null);
  const openingRef = useRef(false);

  const logoURL = useMemo(() => {
    const raw = tokenContract?.logoURL?.trim();
    if (raw && raw.length > 0) {
      return raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')
        ? raw
        : `/${raw.replace(/^\/+/, '')}`;
    }
    return defaultMissingImage;
  }, [tokenContract?.logoURL]);

  const handleMissingLogoURL = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    img.onerror = null;
    img.src = defaultMissingImage;

    if (tokenContract?.symbol && tokenContract?.address) {
      debugLog.log(`⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`);
    } else {
      debugLog.log('⚠️ Missing logo (no tokenContract info available)');
    }
  }, [tokenContract]);

  // stop bubbling for mousedown and click; some “outside close” handlers listen on either
  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const stopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Probe visibility a few times after open to detect an immediate close
  const schedulePostChecks = useCallback((panel: SP_COIN_DISPLAY) => {
    const t0 = performance.now();
    const base = lastOpenAtRef.current ?? t0;

    const check = (label: string) => {
      const now = performance.now();
      const v = isVisible(panel);
      const sellV = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      const buyV  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      debugLog.log(
        `[post-check:${label}] +${Math.round(now - base)}ms { panel=${SP_COIN_DISPLAY[panel]}, sell=${sellV}, buy=${buyV} }`
      );
      if (!v && now - base < 300) {
        debugLog.warn?.(
          `⚠️ Detected early close ("flash"): ${SP_COIN_DISPLAY[panel]} closed within ${Math.round(now - base)}ms`
        );
      }
    };

    setTimeout(() => check('0ms'), 0);
    setTimeout(() => check('150ms'), 150);
    setTimeout(() => {
      openingRef.current = false;
      check('400ms');
    }, 400);
  }, [isVisible]);

  const openTokenSelectPanel = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (openingRef.current) {
      debugLog.log('⏳ Ignoring re-entrant open while a previous open is in-flight');
      return;
    }

    clearFSMTraceFromMemory();
    openingRef.current = true;
    lastOpenAtRef.current = performance.now();

    const panel = isSellRoot
      ? SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL
      : SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;

    // Snapshot before
    const beforeSell = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const beforeBuy  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    debugLog.log(`[direct-open] before { sell=${beforeSell}, buy=${beforeBuy}, target=${SP_COIN_DISPLAY[panel]} }`);

    // 🔴 Open directly
    openPanel(panel);

    // Immediate after snapshot
    const afterSell = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const afterBuy  = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    debugLog.log(`[direct-open] after  { sell=${afterSell}, buy=${afterBuy}, target=${SP_COIN_DISPLAY[panel]} }`);

    schedulePostChecks(panel);
  }, [isSellRoot, openPanel, isVisible, schedulePostChecks]);

  return (
    <div
      id='TokenSelectDropDown'
      className={styles.assetSelect}
      onClick={stopClick}
      onMouseDown={stopMouseDown}
      data-panel-root={isSellRoot ? 'sell' : 'buy'}
    >
      {tokenContract ? (
        <>
          <img
            id='TokenSelectDropDownImage.png'
            className='h-9 w-9 mr-2 rounded-md cursor-pointer'
            alt={`${tokenContract.name ?? tokenContract.symbol ?? 'token'} logo`}
            src={logoURL}
            loading='lazy'
            decoding='async'
            onMouseDown={stopMouseDown}
            onClick={openTokenSelectPanel}
            onError={handleMissingLogoURL}
            data-testid='token-dropdown-avatar'
          />
          {tokenContract.symbol ?? 'Select Token'}
        </>
      ) : (
        <>Select Token:</>
      )}

      <ChevronDown
        id='ChevronDown'
        size={18}
        className='ml-2 cursor-pointer'
        onMouseDown={stopMouseDown}
        onClick={openTokenSelectPanel}
        data-testid='token-dropdown-chevron'
      />
    </div>
  );
}
