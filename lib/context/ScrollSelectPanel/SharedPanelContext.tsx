// File: components/containers/TokenSelectDropDown.tsx

'use client';

import { useCallback, useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  getInputStateString,
  InputState,
  SP_COIN_DISPLAY,
  TokenContract,
} from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
  useDisplayControls,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';

import { TokenSelectScrollPanel } from '@/components/containers/AssetSelectScroll';
import useSharedPanelContext from '@/lib/context/ScrollSelectPanel/SharedPanelContext';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

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

    debugLog.log(`❌ Missing logo for ${tokenContract?.symbol} (${tokenAddr})`);
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
    feedType,
  } = useSharedPanelContext();

  const { updateAssetScrollDisplay } = useDisplayControls();

  const openDialog = useCallback(() => {
    debugLog.log(`📂 Opening Token dialog for containerType=${containerType}`);
    setInputState(InputState.VALID_INPUT);
    setActivePanelFeed(feedType);
    setActiveContainerType(containerType);
    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_ON);
  }, [
    setInputState,
    setActivePanelFeed,
    setActiveContainerType,
    containerType,
    feedType,
    updateAssetScrollDisplay,
  ]);

  useEffect(() => {
    debugLog.log(`🎯 inputState changed → ${getInputStateString(inputState)}`);
    debugLog.log(`🧭 containerType=${containerType}, activeContainerType=${activeContainerType}`);
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
