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
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  /** The container this dropdown belongs to (SELL_SELECT_PANEL_LIST or BUY_SELECT_PANEL_LIST caller) */
  containerType: SP_COIN_DISPLAY;
}

function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const [tokenContract] =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? sellHook : buyHook;

  // Panel-tree controls
  const { openPanel } = usePanelTree();

  // Compute the exact TokenSelect panel we must open (BUY or SELL selector)
  const targetTokenSelectPanel: SP_COIN_DISPLAY =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST
      ? SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST
      : SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;

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

  const openTokenSelectPanel = useCallback(() => {
    // (Optional) clear FSM trace
    clearFSMTraceFromMemory();

    // Open the correct TokenSelect panel inside the main overlay group (radio behavior)
    debugLog.log(
      `📂 Opening TokenSelectPanel: ${SP_COIN_DISPLAY[targetTokenSelectPanel]} in MAIN_OVERLAY_GROUP`
    );

    // If your hook supports a group/options arg, keep it. Otherwise, just pass the enum.
    // @ts-expect-error — openPanel’s overload may accept options in your app; remove if not needed.
    openPanel(targetTokenSelectPanel, { group: 'MAIN_OVERLAY_GROUP', exclusive: true });
  }, [targetTokenSelectPanel, openPanel]);

  // Click on the avatar should also open the selector (no alert dumps)
  const handleAvatarClick = openTokenSelectPanel;

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
            onClick={handleAvatarClick}
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
        onClick={openTokenSelectPanel}
      />
    </div>
  );
}

export default TokenSelectDropDown;
