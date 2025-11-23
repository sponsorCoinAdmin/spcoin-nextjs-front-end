// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useMemo, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType: SP_COIN_DISPLAY.SELL_SELECT_PANEL | SP_COIN_DISPLAY.BUY_SELECT_PANEL;
}

export default function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const isSellRoot = containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL;
  const [tokenContract] = isSellRoot ? sellHook : buyHook;

  const { openSellList, openBuyList } = usePanelTransitions();
  const { isVisible } = usePanelTree();

  // Guard against re-entrancy + help diagnose "flash close"
  const lastOpenAtRef = useRef<number | null>(null);
  const openingRef = useRef(false);

  const logoURL = useMemo(() => {
    if (!tokenContract) return defaultMissingImage;

    const raw = tokenContract.logoURL?.trim();

    // If this is an absolute remote URL, respect it as-is.
    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      return raw;
    }

    // For local assets, derive the path from address + chainId so that
    // case-normalization (UPPERCASE dirs) stays consistent with assetHelpers.
    if (tokenContract.address && typeof tokenContract.chainId === 'number') {
      return getTokenLogoURL({
        address: tokenContract.address,
        chainId: tokenContract.chainId,
      });
    }

    // Fallback: normalize any other non-empty relative path.
    if (raw && raw.length > 0) {
      return raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
    }

    return defaultMissingImage;
  }, [tokenContract]);

  const handleMissingLogoURL = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      img.onerror = null;
      img.src = defaultMissingImage;
      if (tokenContract?.symbol && tokenContract?.address) {
        debugLog.log?.(
          `⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`
        );
      } else {
        debugLog.log?.('⚠️ Missing logo (no tokenContract info available)');
      }
    },
    [tokenContract]
  );

  // stop bubbling for mousedown and click; some “outside close” handlers listen on either
  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const stopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Post-open visibility probes to catch "flash close"
  const schedulePostChecks = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const t0 = performance.now();
      const check = (label: string) => {
        const now = performance.now();
        const v = isVisible(panel);
        const sellV = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
        const buyV = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
        debugLog.log?.(
          `[post-check:${label}] +${Math.round(
            now - (lastOpenAtRef.current ?? t0)
          )}ms { panel=${SP_COIN_DISPLAY[panel]}, sell=${sellV}, buy=${buyV} }`
        );
        // If we see it already closed within 250ms, warn loudly
        if (!v && now - (lastOpenAtRef.current ?? t0) < 300) {
          debugLog.warn?.(
            `⚠️ Detected early close ("flash"): ${
              SP_COIN_DISPLAY[panel]
            } closed within ${Math.round(now - (lastOpenAtRef.current ?? t0))}ms`
          );
        }
      };

      // Do a couple of quick samples
      setTimeout(() => check('0ms'), 0);
      setTimeout(() => check('150ms'), 150);
      setTimeout(() => {
        openingRef.current = false;
        check('400ms');
      }, 400);
    },
    [isVisible]
  );

  const openTokenSelectPanel = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // If we’re already in the middle of opening due to rapid double-clicks, ignore
      if (openingRef.current) {
        debugLog.log?.(
          '⏳ Ignoring re-entrant open while a previous open is in-flight'
        );
        return;
      }

      clearFSMTraceFromMemory();

      const methodName = 'TokenSelectDropDown:openTokenSelectPanel';
      openingRef.current = true;
      lastOpenAtRef.current = performance.now();

      // Open synchronously to avoid microtask races with global outside-click closers
      if (isSellRoot) {
        openSellList({ methodName });
        schedulePostChecks(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      } else {
        openBuyList({ methodName });
        schedulePostChecks(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      }

      // Immediate snapshot after open
      const sellNow = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      const buyNow = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      debugLog.log?.(
        `openTokenSelectPanel → visible now { sell: ${sellNow}, buy: ${buyNow} } (isSellRoot=${isSellRoot})`
      );
    },
    [isSellRoot, openSellList, openBuyList, isVisible, schedulePostChecks]
  );

  function displaySymbol(token: TokenContract) {
    if (DEBUG_ENABLED) {
      const msg = stringifyBigInt(token);
      debugLog.log?.('[TokenSelectDropDown] tokenContract', msg);
    }
    return token.symbol ?? 'Select Token';
  }

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
          {displaySymbol(tokenContract)}
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
