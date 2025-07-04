'use client';

import { useCallback, useEffect, useContext } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import {
  SP_COIN_DISPLAY,
  CONTAINER_TYPE,
  InputState,
  TokenContract,
  getInputStateString,
} from '@/lib/structure';
import {
  useDisplayControls,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { TokenSelectScrollPanel } from '../AssetSelectScroll';
import { SharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelProvider';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

// ✅ Local hook to avoid circular import
function useSharedPanelContext() {
  const context = useContext(SharedPanelContext);
  if (!context) {
    throw new Error('useSharedPanelContext must be used within a SharedPanelProvider');
  }
  return context;
}

interface Props {
  containerType: CONTAINER_TYPE;
}

function TokenSelectDropDown({ containerType }: Props) {
  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();

  const [tokenContract] =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellHook : buyHook;

  const logoSrc = useAssetLogoURL(tokenContract?.address || '', 'token');

  const handleMissingLogoURL = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const tokenAddr = tokenContract?.address;
    if (!tokenAddr) return;

    markLogoAsBroken(tokenAddr);
    event.currentTarget.src = defaultMissingImage;

    debugLog.log(`Missing logo for ${tokenContract?.symbol} (${tokenAddr})`);
  };

  return (
    <InnerDropDown
      tokenContract={tokenContract}
      containerType={containerType}
      logoSrc={logoSrc}
      onError={handleMissingLogoURL}
    />
  );
}

function InnerDropDown({
  tokenContract,
  containerType,
  logoSrc,
  onError,
}: {
  tokenContract: TokenContract | undefined;
  containerType: CONTAINER_TYPE;
  logoSrc: string;
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const {
    inputState,
    setInputState,
    activePanelFeed,
    setActivePanelFeed,
    activeContainerType,
    setActiveContainerType,
    setContainerType,
    setFeedType,
    feedType,
  } = useSharedPanelContext();

  const { updateAssetScrollDisplay } = useDisplayControls();

  const openDialog = useCallback(() => {
    debugLog.log(`📂 Opening Token dialog for containerType=${containerType}`);
    setInputState(InputState.VALID_INPUT);
    setContainerType(containerType);
    setFeedType(feedType);
    setActivePanelFeed(feedType);
    setActiveContainerType(containerType);
    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_ON);
  }, [
    containerType,
    feedType,
    setInputState,
    setContainerType,
    setFeedType,
    setActivePanelFeed,
    setActiveContainerType,
    updateAssetScrollDisplay,
  ]);

  useEffect(() => {
    debugLog.log(`🎯 inputState changed → ${getInputStateString(inputState)}`);
    debugLog.log(`🧭 Context containerType = ${containerType}, activeContainerType = ${activeContainerType}`);
  }, [inputState, containerType, activeContainerType]);

  const isPanelVisible =
    activePanelFeed === feedType &&
    activeContainerType === containerType;

  return (
    <>
      {isPanelVisible && (
        <>
          {debugLog.log(`🔓 Showing TokenSelectScrollPanel for containerType=${containerType}`)}
          <TokenSelectScrollPanel />
        </>
      )}
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${tokenContract.name} logo`}
              src={logoSrc}
              onClick={() => alert(stringifyBigInt(tokenContract))}
              onError={onError}
            />
            {tokenContract.symbol}
          </>
        ) : (
          <>Select Token:</>
        )}
        <ChevronDown
          size={18}
          className="ml-2 cursor-pointer"
          onClick={openDialog}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
