// File: components/containers/TokenSelectDropDown.tsx

'use client';

import { useCallback } from 'react';
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
import {
  SharedPanelProvider,
  useSharedPanelContext,
} from '@/lib/context/ScrollSelectPanel/SharedPanelContext';

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
  const [tokenContract, setTokenContract] =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellHook : buyHook;
  // const { inputState, setInputState } = useSharedPanelContext();

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


// setInputState(InputState.CLOSE_SELECT_INPUT)



      if (state === InputState.CLOSE_SELECT_INPUT) {
        debugLog.log('🧬 Cloning and setting tokenContract');
        setTokenContract(structuredClone(contract));
      }
    },
    [setTokenContract]
  );

  return (
    <SharedPanelProvider
      containerType={containerType}
      onSelect={processSelect}
    >
      <InnerDropDown
        tokenContract={tokenContract}
        setTokenContract={setTokenContract}
        containerType={containerType}
        logoSrc={logoSrc}
        onError={handleMissingLogoURL}
      />
    </SharedPanelProvider>
  );
}

import { useEffect } from 'react'; // ✅ Make sure this is imported

function InnerDropDown({
  tokenContract,
  setTokenContract,
  containerType,
  logoSrc,
  onError,
}: {
  tokenContract: TokenContract | undefined;
  setTokenContract: (t: TokenContract) => void;
  containerType: CONTAINER_TYPE;
  logoSrc: string;
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const { inputState, setInputState } = useSharedPanelContext();

  const openDialog = useCallback(() => {
    debugLog.log('📂 Opening Token dialog');
    setInputState(InputState.VALID_INPUT); // 🟡 This opens the panel
  }, [setInputState]);

  // ✅ Alert on inputState change
  useEffect(() => {
    alert(`🎯 inputState changed → ${getInputStateString(inputState)}`);
  }, [inputState]);

  return (
    <>
      {inputState !== InputState.CLOSE_SELECT_INPUT && <TokenSelectScrollPanel />}
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
