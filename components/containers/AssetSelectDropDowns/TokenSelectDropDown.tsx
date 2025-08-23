// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
  useActiveDisplay,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/network/utils';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType: SP_COIN_DISPLAY;
}

function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const [tokenContract] =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellHook : buyHook;

  const { setActiveDisplay } = useActiveDisplay();

  // Resolve logo from tokenContract.logoURL, with normalization & fallback.
  const logoURL = useMemo(() => {
    const raw = tokenContract?.logoURL?.trim();
    if (raw && raw.length > 0) {
      // Keep absolute URLs and already-rooted paths; normalize "assets/..." to "/assets/..."
      return raw.startsWith('http://') ||
        raw.startsWith('https://') ||
        raw.startsWith('/')
        ? raw
        : `/${raw.replace(/^\/+/, '')}`;
    }
    return defaultMissingImage;
  }, [tokenContract?.logoURL]);

  // Safe one-shot error handler: swap to fallback and prevent loops if fallback fails.
  const handleMissingLogoURL = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      img.onerror = null; // prevent infinite loop if fallback fails
      img.src = defaultMissingImage;

      if (tokenContract?.symbol && tokenContract?.address) {
        debugLog.log(`⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`);
      } else {
        debugLog.log(`⚠️ Missing logo (no tokenContract info available)`);
      }
    },
    [tokenContract]
  );

  const showPanel = useCallback(() => {
    debugLog.log(`📂 Opening ${SP_COIN_DISPLAY[containerType]} dialog`);
    // Optional: clear FSM trace before opening (keep if useful to you)
    clearFSMTraceFromMemory();

    setActiveDisplay(
      containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
        ? SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
        : SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL
    );
  }, [containerType, setActiveDisplay]);

  // Click handler for the token image (restored)
  const handleSelect = useCallback(() => {
    const msg = stringifyBigInt({
      ...tokenContract,
      _resolvedLogoURL: logoURL, // include what’s actually being displayed
    } as any);
    console.log(msg);
    alert(msg);
  }, [tokenContract, logoURL]);

  return (
    <div id="TokenSelectDropDown" className={styles.assetSelect}>
      {tokenContract ? (
        <>
          <img
            id="TokenSelectDropDownImage.png"
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            alt={`${tokenContract.name} logo`}
            src={logoURL}
            loading="lazy"
            decoding="async"
            onClick={handleSelect}
            onError={handleMissingLogoURL}
          />
          {tokenContract.symbol}
        </>
      ) : (
        <>Select Token:</>
      )}
      <ChevronDown
        id="ChevronDown"
        size={18}
        className="ml-2 cursor-pointer"
        onClick={showPanel}
      />
    </div>
  );
}

export default TokenSelectDropDown;
