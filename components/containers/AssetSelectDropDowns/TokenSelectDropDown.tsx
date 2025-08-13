// File: components/containers/TokenSelectDropDown.tsx
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
  useActiveDisplay,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { defaultMissingImage } from '@/lib/network/utils';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType: SP_COIN_DISPLAY_NEW;
}

function TokenSelectDropDown({ containerType }: Props) {
  const instanceId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    console.log(
      `🆕 Mounted TokenSelectDropDown → instanceId=${instanceId} containerType=${SP_COIN_DISPLAY_NEW[containerType]}`
    );
    return () => {
      console.log(
        `🧹 Unmounted TokenSelectDropDown → instanceId=${instanceId} containerType=${SP_COIN_DISPLAY_NEW[containerType]}`
      );
    };
  }, [instanceId, containerType]);

  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const [tokenContract] =
    containerType === SP_COIN_DISPLAY_NEW.SELL_SELECT_SCROLL_PANEL ? sellHook : buyHook;

  const { setActiveDisplay } = useActiveDisplay();

  const logoSrc = useAssetLogoURL(tokenContract?.address || '', 'token');

  const handleMissingLogoURL = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const tokenAddr = tokenContract?.address;
      if (!tokenAddr) return;

      markLogoAsBroken(tokenAddr);
      event.currentTarget.src = defaultMissingImage;

      debugLog.log(`⚠️ Missing logo for ${tokenContract?.symbol} (${tokenAddr})`);
    },
    [tokenContract]
  );

  const showPanel = useCallback(() => {
    debugLog.log(`📂 Opening ${SP_COIN_DISPLAY_NEW[containerType]} dialog`);

    // 🧹 Clear FSM trace before opening
    clearFSMTraceFromMemory();

    if (containerType === SP_COIN_DISPLAY_NEW.SELL_SELECT_SCROLL_PANEL) {
      setActiveDisplay(SP_COIN_DISPLAY_NEW.SELL_SELECT_SCROLL_PANEL);
    } else {
      setActiveDisplay(SP_COIN_DISPLAY_NEW.BUY_SELECT_SCROLL_PANEL);
    }
  }, [containerType, setActiveDisplay]);

  return (
    <div id="TokenSelectDropDown" className={styles.assetSelect}>
      {tokenContract ? (
        <>
          <img
            id="TokenSelectDropDownImage.png"
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            alt={`${tokenContract.name} logo`}
            src={logoSrc}
            onClick={() => alert(stringifyBigInt(tokenContract))}
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
