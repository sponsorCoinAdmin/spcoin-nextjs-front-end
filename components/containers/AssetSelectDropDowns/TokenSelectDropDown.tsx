// File: components/containers/TokenSelectDropDown.tsx

'use client';

import { useCallback, useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  getInputStateString,
  InputState,
  TokenContract,
  SP_COIN_DISPLAY, // ✅ make sure this is imported
} from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
  useActiveDisplay,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';

import { TokenSelectScrollPanel } from '../AssetSelectScrollPanels';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';

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
  const { updateActiveDisplay } = useActiveDisplay();
  const { inputState, setInputState, validHexInput } = useSharedPanelContext();

  const safeInput = validHexInput.trim() !== '' ? validHexInput : undefined;

  useValidateFSMInput(safeInput);

  const showPanel = useCallback(() => {
    debugLog.log('📂 Opening Token dialog');
    setInputState(InputState.EMPTY_INPUT);
    updateActiveDisplay(SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_PANEL); // ✅ FIXED: pass valid SP_COIN_DISPLAY value
  }, [setInputState, updateActiveDisplay]);

  useEffect(() => {
    debugLog.log(`🎯 inputState changed → ${getInputStateString(inputState)}`);
  }, [inputState]);

  return (
    <>
      <TokenSelectScrollPanel />
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
          onClick={showPanel}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
