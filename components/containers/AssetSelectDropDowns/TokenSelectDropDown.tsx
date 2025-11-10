'use client';

import { useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/network/utils';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

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

  const logoURL = useMemo(() => {
    const raw = tokenContract?.logoURL?.trim();
    if (raw && raw.length > 0) {
      return raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
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

  const openTokenSelectPanel = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    clearFSMTraceFromMemory();

    const methodName = 'TokenSelectDropDown:openTokenSelectPanel';

    // Open synchronously; avoiding microtask races with any click/mousedown closers
    if (isSellRoot) {
      openSellList({ methodName });
    } else {
      openBuyList({ methodName });
    }

    // Optional: quick post-check log
    const sellNow = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const buyNow = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    debugLog.log(`openTokenSelectPanel → visible now { sell: ${sellNow}, buy: ${buyNow} }`);
  }, [isSellRoot, openSellList, openBuyList, isVisible]);

  return (
    <div id='TokenSelectDropDown' className={styles.assetSelect} onClick={stopClick} onMouseDown={stopMouseDown}>
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
      />
    </div>
  );
}
