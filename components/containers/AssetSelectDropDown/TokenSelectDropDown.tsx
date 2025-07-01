// File: components/containers/TokenSelectDropDown.tsx

'use client';

import { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  getInputStateString,
  InputState,
  TokenContract,
} from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { TokenSelectScrollPanel } from '../AssetSelectScroll';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  containerType: CONTAINER_TYPE;
}

function TokenSelectDropDown({ containerType }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => {
    debugLog.log('📂 Opening Token dialog');
    setShowDialog(true);
  }, []);

  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();
  const [tokenContract, setTokenContract] =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellHook : buyHook;

  const logoSrc = useAssetLogoURL(tokenContract?.address || '', 'token');

  const handleMissingLogoURL = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const tokenAddr = tokenContract?.address;
    if (!tokenAddr) return;

    markLogoAsBroken(tokenAddr);
    event.currentTarget.src = defaultMissingImage;

    debugLog.log(`Missing logo for ${tokenContract?.symbol} (${tokenAddr})`);
  };

  const processSelect = useCallback(
  (contract: TokenContract, state: InputState) => {
    const stateLabel = getInputStateString(state);
    debugLog.log(`🎯 onSelect fired: state = ${state} → ${stateLabel}`, contract);

    if (state === InputState.CLOSE_INPUT) {
      debugLog.log('🧬 Cloning and setting tokenContract');
      setTokenContract(structuredClone(contract));
      setShowDialog(false);
    }
  },
  [setTokenContract]
);

  return (
    <>
      {showDialog && (
        <TokenSelectScrollPanel
          setShowDialog={setShowDialog}
          containerType={containerType}
          onSelect={processSelect}
        />
      )}
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
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
          size={18}
          className="ml-2 cursor-pointer"
          onClick={openDialog}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
