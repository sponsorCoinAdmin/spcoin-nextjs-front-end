// File: @lib/components/views/TradingStationPanel/lib/AssetSelectDropDowns/TokenSelectDropDown.tsx

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

  // ✅ new transitions API
  const { openOverlay } = usePanelTransitions();
  const { isVisible, openPanel } = usePanelTree();

  // Guard against re-entrancy + help diagnose "flash close"
  const lastOpenAtRef = useRef<number | null>(null);
  const openingRef = useRef(false);

  const logoURL = useMemo(() => {
    if (!tokenContract) return defaultMissingImage;

    const raw = tokenContract.logoURL?.trim();

    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      return raw;
    }

    if (tokenContract.address && typeof tokenContract.chainId === 'number') {
      return getTokenLogoURL({
        address: tokenContract.address,
        chainId: tokenContract.chainId,
      });
    }

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
        debugLog.log?.(`⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`);
      } else {
        debugLog.log?.('⚠️ Missing logo (no tokenContract info available)');
      }
    },
    [tokenContract],
  );

  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const stopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const schedulePostChecks = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const t0 = performance.now();
      const check = (label: string) => {
        const now = performance.now();
        const v = isVisible(panel);
        const listV = isVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
        const buyMode = isVisible(SP_COIN_DISPLAY.BUY_TOKEN);
        const sellMode = isVisible(SP_COIN_DISPLAY.SELL_TOKEN);
        debugLog.log?.(
          `[post-check:${label}] +${Math.round(
            now - (lastOpenAtRef.current ?? t0),
          )}ms { panel=${SP_COIN_DISPLAY[panel]}, list=${listV}, buyMode=${buyMode}, sellMode=${sellMode} }`,
        );
        if (!v && now - (lastOpenAtRef.current ?? t0) < 300) {
          debugLog.warn?.(
            `⚠️ Detected early close ("flash"): ${
              SP_COIN_DISPLAY[panel]
            } closed within ${Math.round(now - (lastOpenAtRef.current ?? t0))}ms`,
          );
        }
      };

      setTimeout(() => check('0ms'), 0);
      setTimeout(() => check('150ms'), 150);
      setTimeout(() => {
        openingRef.current = false;
        check('400ms');
      }, 400);
    },
    [isVisible],
  );

  const openTokenSelectPanel = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (openingRef.current) {
        debugLog.log?.('⏳ Ignoring re-entrant open while a previous open is in-flight');
        return;
      }

      clearFSMTraceFromMemory();

      const methodName = 'TokenSelectDropDown:openTokenSelectPanel';
      openingRef.current = true;
      lastOpenAtRef.current = performance.now();

      // ✅ open via generic openOverlay
      if (isSellRoot) {
        // SELL dropdown -> use SELL_TOKEN mode
        openPanel(SP_COIN_DISPLAY.SELL_TOKEN, `${methodName}:setSellMode`);
        openOverlay(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, { methodName });
        schedulePostChecks(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
      } else {
        // BUY dropdown -> use BUY_TOKEN mode
        openPanel(SP_COIN_DISPLAY.BUY_TOKEN, `${methodName}:setBuyMode`);
        openOverlay(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, { methodName });
        schedulePostChecks(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
      }

      const listNow = isVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
      const buyModeNow = isVisible(SP_COIN_DISPLAY.BUY_TOKEN);
      const sellModeNow = isVisible(SP_COIN_DISPLAY.SELL_TOKEN);
      debugLog.log?.(
        `openTokenSelectPanel → visible now { list: ${listNow}, buyMode: ${buyModeNow}, sellMode: ${sellModeNow} } (isSellRoot=${isSellRoot})`,
      );
    },
    [isSellRoot, openOverlay, openPanel, isVisible, schedulePostChecks],
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
      id="TokenSelectDropDown"
      className={styles.assetSelect}
      onClick={stopClick}
      onMouseDown={stopMouseDown}
      data-panel-root={isSellRoot ? 'sell' : 'buy'}
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
            onMouseDown={stopMouseDown}
            onClick={openTokenSelectPanel}
            onError={handleMissingLogoURL}
            data-testid="token-dropdown-avatar"
          />
          {displaySymbol(tokenContract)}
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
        data-testid="token-dropdown-chevron"
      />
    </div>
  );
}
