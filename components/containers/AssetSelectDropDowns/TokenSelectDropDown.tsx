// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';

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
  const instanceId = useMemo(() => crypto.randomUUID(), []);
  const chainId = useChainId();

  useEffect(() => {
    console.log(
      `🆕 Mounted TokenSelectDropDown → instanceId=${instanceId} containerType=${SP_COIN_DISPLAY[containerType]}`
    );
    return () => {
      console.log(
        `🧹 Unmounted TokenSelectDropDown → instanceId=${instanceId} containerType=${SP_COIN_DISPLAY[containerType]}`
      );
    };
  }, [instanceId, containerType]);

  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const [tokenContract] =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellHook : buyHook;

  const { setActiveDisplay } = useActiveDisplay();

  // Build the logo src locally; fallback when address/chainId invalid or missing.
  const logoSrc = useMemo(() => {
    const addr = tokenContract?.address ?? '';
    if (!addr || !isAddress(addr) || !chainId) return defaultMissingImage;
    return `/assets/blockchains/${chainId}/contracts/${addr.toLowerCase()}/logo.png`;
  }, [tokenContract?.address, chainId]);

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

    // 🧹 Clear FSM trace before opening
    clearFSMTraceFromMemory();

    if (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
      setActiveDisplay(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL);
    } else {
      setActiveDisplay(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL);
    }
  }, [containerType, setActiveDisplay]);

  const handleSelect = () => {
    let msg: string = stringifyBigInt(tokenContract);
    msg += `\nlogoSrc = ${logoSrc}`;
    console.log(msg);
    alert(msg);
  };

  return (
    <div id="TokenSelectDropDown" className={styles.assetSelect}>
      {tokenContract ? (
        <>
          <img
            id="TokenSelectDropDownImage.png"
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            alt={`${tokenContract.name} logo`}
            src={logoSrc}
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
